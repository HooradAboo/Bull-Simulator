import json

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.contacts import load_contacts
from app.emails import load_emails
from app.self_efficacy import load_self_efficacy_questions

IT_CONTACT_NAME = "USF IT Help Desk"

# Maps each self-efficacy statement's config key to the pre/post column
# names on Participant.
SELF_EFFICACY_FIELD_MAP: dict[str, tuple[str, str]] = {
    "recognizeLinks": ("self_efficacy_recognize_links", "self_efficacy_post_recognize_links"),
    "verifyLegitimacy": ("self_efficacy_verify_legitimacy", "self_efficacy_post_verify_legitimacy"),
    "avoidSuspicious": ("self_efficacy_avoid_suspicious", "self_efficacy_post_avoid_suspicious"),
    "verifyTrustedSource": (
        "self_efficacy_verify_trusted_source",
        "self_efficacy_post_verify_trusted_source",
    ),
    "reportPhishing": ("self_efficacy_report_phishing", "self_efficacy_post_report_phishing"),
    "recoverySteps": ("self_efficacy_recovery_steps", "self_efficacy_post_recovery_steps"),
}

REQUIRED_CATEGORIES = {
    "mark_as_read",
    "reply",
    "forward",
    "forward_to_it",
    "delete",
    "report",
    "click_link",
    "open_attachment",
}


def load_safe_action_matrix() -> dict[str, dict[str, int]]:
    """Researcher-facing scoring rubric (never shown to participants as-is) -
    each decision a participant can make on an email, scored separately
    depending on whether that email was actually phishing or legitimate.
    Positive = safe/correct, negative = a miss. "forward_to_it" is a
    "forward" action whose recipient matches the IT Help Desk contact; any
    other recipient is a plain "forward".
    """
    path = settings.safe_action_matrix_config_path
    if not path.exists():
        raise FileNotFoundError(f"Safe action matrix config not found: {path}")

    data = json.loads(path.read_text())
    missing = REQUIRED_CATEGORIES - data.keys()
    if missing:
        raise ValueError(f"Safe action matrix config is missing categories: {sorted(missing)}")
    for category, scores in data.items():
        if set(scores.keys()) != {"phishing", "legit"}:
            raise ValueError(
                f"Safe action matrix category {category!r} must have exactly "
                f"'phishing' and 'legit' keys"
            )
    return data


ACTION_TAKEN_TO_CATEGORY = {
    "ignore": "mark_as_read",
    "reply": "reply",
    "report_phishing": "report",
    "delete": "delete",
    "click_link": "click_link",
    # "forward" resolves to "forward" or "forward_to_it" - handled separately.
}


def _it_contact_email() -> str | None:
    for contact in load_contacts():
        if contact.name == IT_CONTACT_NAME:
            return contact.email.lower()
    return None


def _category_for(action_taken: str, recipient: str | None, it_email: str | None) -> str:
    if action_taken == "forward":
        if it_email and recipient and recipient.strip().lower() == it_email:
            return "forward_to_it"
        return "forward"
    return ACTION_TAKEN_TO_CATEGORY[action_taken]


class ActionBreakdown(BaseModel):
    legit_count: int
    phishing_count: int


class GroundTruthBreakdown(BaseModel):
    total: int
    caught: int  # phishing correctly identified as a threat (report/forward_to_it/delete)
    missed: int  # phishing engaged with as if it were legitimate


class LegitBreakdown(BaseModel):
    total: int
    handled_well: int  # engaged with normally, or safely ignored/deleted
    false_positive: int  # incorrectly reported or forwarded to IT as if it were phishing


class AttachmentBreakdown(BaseModel):
    legit_opened: int
    phishing_opened: int


CALIBRATION_MIN_N = 3
CALIBRATION_SYNC_THRESHOLD = 10


def _calibration_state(confidence: float | None, accuracy: float | None, n: int) -> str:
    """"in_sync" (within CALIBRATION_SYNC_THRESHOLD points), "undersold"
    (accuracy higher than confidence - they were more often right than they
    felt), "oversold" (confidence higher than accuracy - confidence ran
    ahead of the outcome), or "not_enough_data" (fewer than
    CALIBRATION_MIN_N decisions in this bucket).
    """
    if n < CALIBRATION_MIN_N or confidence is None or accuracy is None:
        return "not_enough_data"
    diff = confidence - accuracy
    if abs(diff) <= CALIBRATION_SYNC_THRESHOLD:
        return "in_sync"
    return "oversold" if diff > 0 else "undersold"


class CalibrationBucket(BaseModel):
    confidence: float | None
    accuracy: float | None  # % of decisions in this bucket that were correct
    n: int
    state: str  # "in_sync" | "undersold" | "oversold" | "not_enough_data"


class ActionCalibrationBucket(CalibrationBucket):
    is_protective: bool  # report/forward_to_it/delete vs. engagement actions


class ConfidenceAverages(BaseModel):
    overall: CalibrationBucket
    phishing: CalibrationBucket  # confidence/accuracy on emails that were actually phishing
    legit: CalibrationBucket  # confidence/accuracy on emails that were actually legitimate
    claimed_phishing: CalibrationBucket  # when they treated it as a threat
    claimed_legit: CalibrationBucket  # when they treated it as safe
    by_action: dict[str, ActionCalibrationBucket]


class SelfEfficacyStatement(BaseModel):
    key: str
    text: str
    pre: int
    post: int | None


class SelfEfficacyBreakdown(BaseModel):
    statements: list[SelfEfficacyStatement]
    pre_average: float
    post_average: float | None


class PerformanceReport(BaseModel):
    total_score: int
    max_possible_score: int
    correct_count: int
    total_count: int
    phishing: GroundTruthBreakdown
    legit: LegitBreakdown
    action_breakdown: dict[str, ActionBreakdown]
    attachments: AttachmentBreakdown
    confidence: ConfidenceAverages
    self_efficacy: SelfEfficacyBreakdown


class _CalibrationAccumulator:
    def __init__(self) -> None:
        self.n = 0
        self.correct = 0
        self.confidence_sum = 0.0
        self.confidence_n = 0

    def add(self, score: int, confidence: int | None) -> None:
        self.n += 1
        if score > 0:
            self.correct += 1
        if confidence is not None:
            self.confidence_sum += confidence
            self.confidence_n += 1

    def confidence_average(self) -> float | None:
        if self.confidence_n == 0:
            return None
        return round(self.confidence_sum / self.confidence_n, 1)

    def accuracy(self) -> float | None:
        if self.n == 0:
            return None
        return round(100 * self.correct / self.n, 1)

    def to_bucket(self) -> CalibrationBucket:
        confidence = self.confidence_average()
        accuracy = self.accuracy()
        return CalibrationBucket(
            confidence=confidence,
            accuracy=accuracy,
            n=self.n,
            state=_calibration_state(confidence, accuracy, self.n),
        )


def build_performance_report(db: Session, participant: models.Participant) -> PerformanceReport:
    emails_by_id = {e.id: e for e in load_emails()}
    it_email = _it_contact_email()
    matrix = load_safe_action_matrix()
    matrix_max = max(score for row in matrix.values() for score in row.values())
    claimed_phishing_categories = {cat for cat, row in matrix.items() if row["phishing"] > 0}

    interactions = (
        db.query(models.EmailInteraction)
        .filter(
            models.EmailInteraction.participant_id == participant.id,
            models.EmailInteraction.action_taken.isnot(None),
        )
        .all()
    )

    total_score = 0
    correct_count = 0
    total_count = 0
    phishing_total = phishing_caught = phishing_missed = 0
    legit_total = legit_handled_well = legit_false_positive = 0
    action_breakdown: dict[str, ActionBreakdown] = {
        category: ActionBreakdown(legit_count=0, phishing_count=0) for category in matrix
    }
    legit_attachments_opened = phishing_attachments_opened = 0

    conf_overall = _CalibrationAccumulator()
    conf_phishing = _CalibrationAccumulator()
    conf_legit = _CalibrationAccumulator()
    conf_claimed_phishing = _CalibrationAccumulator()
    conf_claimed_legit = _CalibrationAccumulator()
    conf_by_action: dict[str, _CalibrationAccumulator] = {
        category: _CalibrationAccumulator() for category in matrix
    }

    for interaction in interactions:
        email = emails_by_id.get(interaction.email_id)
        if email is None:
            continue

        truth_key = "phishing" if email.is_phishing else "legit"
        category = _category_for(interaction.action_taken, interaction.recipient, it_email)

        score = matrix[category][truth_key]

        total_score += score
        total_count += 1
        if score > 0:
            correct_count += 1

        if email.is_phishing:
            phishing_total += 1
            if score > 0:
                phishing_caught += 1
            else:
                phishing_missed += 1
            action_breakdown[category].phishing_count += 1
        else:
            legit_total += 1
            if score < 0:
                legit_false_positive += 1
            else:
                legit_handled_well += 1
            action_breakdown[category].legit_count += 1

        if interaction.attachment_opened and email.attachment:
            attachment_score = matrix["open_attachment"][truth_key]
            total_score += attachment_score
            if email.is_phishing:
                phishing_attachments_opened += 1
            else:
                legit_attachments_opened += 1

        conf_overall.add(score, interaction.confidence_rating)
        conf_by_action[category].add(score, interaction.confidence_rating)
        if email.is_phishing:
            conf_phishing.add(score, interaction.confidence_rating)
        else:
            conf_legit.add(score, interaction.confidence_rating)
        if category in claimed_phishing_categories:
            conf_claimed_phishing.add(score, interaction.confidence_rating)
        else:
            conf_claimed_legit.add(score, interaction.confidence_rating)

    statements = [
        SelfEfficacyStatement(
            key=question.key,
            text=question.text,
            pre=getattr(participant, SELF_EFFICACY_FIELD_MAP[question.key][0]),
            post=getattr(participant, SELF_EFFICACY_FIELD_MAP[question.key][1]),
        )
        for question in load_self_efficacy_questions()
        if question.key in SELF_EFFICACY_FIELD_MAP
    ]
    pre_average = round(sum(s.pre for s in statements) / len(statements), 1)
    post_values = [s.post for s in statements if s.post is not None]
    post_average = round(sum(post_values) / len(post_values), 1) if len(post_values) == len(statements) else None

    return PerformanceReport(
        total_score=total_score,
        max_possible_score=matrix_max * total_count,
        correct_count=correct_count,
        total_count=total_count,
        phishing=GroundTruthBreakdown(
            total=phishing_total, caught=phishing_caught, missed=phishing_missed
        ),
        legit=LegitBreakdown(
            total=legit_total,
            handled_well=legit_handled_well,
            false_positive=legit_false_positive,
        ),
        action_breakdown=action_breakdown,
        attachments=AttachmentBreakdown(
            legit_opened=legit_attachments_opened,
            phishing_opened=phishing_attachments_opened,
        ),
        confidence=ConfidenceAverages(
            overall=conf_overall.to_bucket(),
            phishing=conf_phishing.to_bucket(),
            legit=conf_legit.to_bucket(),
            claimed_phishing=conf_claimed_phishing.to_bucket(),
            claimed_legit=conf_claimed_legit.to_bucket(),
            by_action={
                category: ActionCalibrationBucket(
                    **acc.to_bucket().model_dump(),
                    is_protective=category in claimed_phishing_categories,
                )
                for category, acc in conf_by_action.items()
            },
        ),
        self_efficacy=SelfEfficacyBreakdown(
            statements=statements,
            pre_average=pre_average,
            post_average=post_average,
        ),
    )
