import json

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.contacts import load_contacts
from app.emails import load_emails

IT_CONTACT_NAME = "USF IT Help Desk"

REQUIRED_CATEGORIES = {
    "mark_as_read",
    "reply",
    "forward",
    "forward_to_it",
    "delete",
    "report",
    "click_link",
    "open_attachment",
    "verify_independently",
}


def load_safe_action_matrix() -> dict[str, dict[str, int]]:
    """Researcher-facing scoring rubric (never shown to participants as-is) -
    each decision a participant can make on an email, scored separately
    depending on whether that email was actually phishing or legitimate.
    Positive = safe/correct, negative = a miss. "forward_to_it" is a
    "forward" action whose recipient matches the IT Help Desk contact; any
    other recipient is a plain "forward".

    The scores themselves aren't consumed by the report anymore (the
    scored-summary UI was removed), but this stays as the single validated
    source of the category list used to key action_breakdown below.
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
    "open_attachment": "open_attachment",
    "verify_independently": "verify_independently",
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
    caught: int  # phishing the participant flagged as suspicious
    missed: int  # phishing the participant trusted


class LegitBreakdown(BaseModel):
    total: int
    handled_well: int  # legitimate email the participant trusted
    false_positive: int  # legitimate email the participant flagged as suspicious


class PerformanceReport(BaseModel):
    phishing: GroundTruthBreakdown
    legit: LegitBreakdown
    action_breakdown: dict[str, ActionBreakdown]


def build_performance_report(db: Session, participant: models.Participant) -> PerformanceReport:
    emails_by_id = {e.id: e for e in load_emails()}

    it_email = _it_contact_email()
    matrix = load_safe_action_matrix()

    interactions_raw = (
        db.query(models.EmailInteraction)
        .filter(
            models.EmailInteraction.participant_id == participant.id,
            models.EmailInteraction.action_taken.isnot(None),
        )
        .order_by(models.EmailInteraction.id)
        .all()
    )
    # There's no DB constraint stopping more than one completed interaction
    # row from existing for the same email (e.g. a double-submission race),
    # which would otherwise double-count that email everywhere below - keep
    # only the latest (highest id) completed row per email_id, same
    # de-duplication already used for the by-netid resume lookup.
    interactions_by_email: dict[str, models.EmailInteraction] = {}
    for interaction in interactions_raw:
        interactions_by_email[interaction.email_id] = interaction
    interactions = list(interactions_by_email.values())

    phishing_total = phishing_caught = phishing_missed = 0
    legit_total = legit_handled_well = legit_false_positive = 0
    action_breakdown: dict[str, ActionBreakdown] = {
        category: ActionBreakdown(legit_count=0, phishing_count=0) for category in matrix
    }

    for interaction in interactions:
        email = emails_by_id.get(interaction.email_id)
        if email is None:
            continue

        category = _category_for(interaction.action_taken, interaction.recipient, it_email)

        # Caught/missed/false-alarm/handled-well are about whether the
        # participant's stated judgment matched reality - not the action
        # they went on to take. Flagging a legitimate email as suspicious is
        # a false alarm even if the action they then took (e.g. archiving)
        # happened to be harmless.
        flagged_suspicious = interaction.perceived_legitimacy == "suspicious"

        if email.is_phishing:
            phishing_total += 1
            if flagged_suspicious:
                phishing_caught += 1
            else:
                phishing_missed += 1
            action_breakdown[category].phishing_count += 1
        else:
            legit_total += 1
            if flagged_suspicious:
                legit_false_positive += 1
            else:
                legit_handled_well += 1
            action_breakdown[category].legit_count += 1

    return PerformanceReport(
        phishing=GroundTruthBreakdown(
            total=phishing_total, caught=phishing_caught, missed=phishing_missed
        ),
        legit=LegitBreakdown(
            total=legit_total,
            handled_well=legit_handled_well,
            false_positive=legit_false_positive,
        ),
        action_breakdown=action_breakdown,
    )
