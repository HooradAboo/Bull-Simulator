from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.contacts import load_contacts
from app.emails import load_emails

IT_CONTACT_NAME = "USF IT Help Desk"

# Researcher-facing scoring rubric (never shown to participants as-is) - each
# decision a participant can make on an email, scored separately depending on
# whether that email was actually phishing or legitimate. Positive = safe/
# correct, negative = a miss. "forward_to_it" is a "forward" action whose
# recipient matches the IT Help Desk contact; any other recipient is a plain
# "forward".
SAFE_ACTION_MATRIX: dict[str, dict[str, int]] = {
    "mark_as_read": {"phishing": -1, "legit": 1},
    "reply": {"phishing": -2, "legit": 2},
    "forward": {"phishing": -1, "legit": 2},
    "forward_to_it": {"phishing": 1, "legit": -1},
    "delete": {"phishing": 1, "legit": 1},
    "report": {"phishing": 2, "legit": -2},
    "click_link": {"phishing": -2, "legit": 2},
    "open_attachment": {"phishing": -2, "legit": 2},
}

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


class PerformanceReport(BaseModel):
    total_score: int
    max_possible_score: int
    correct_count: int
    total_count: int
    phishing: GroundTruthBreakdown
    legit: LegitBreakdown
    action_breakdown: dict[str, ActionBreakdown]
    attachments: AttachmentBreakdown


def build_performance_report(db: Session, participant_id: str) -> PerformanceReport:
    emails_by_id = {e.id: e for e in load_emails()}
    it_email = _it_contact_email()

    interactions = (
        db.query(models.EmailInteraction)
        .filter(
            models.EmailInteraction.participant_id == participant_id,
            models.EmailInteraction.action_taken.isnot(None),
        )
        .all()
    )

    total_score = 0
    max_possible_score = 0
    correct_count = 0
    total_count = 0
    phishing_total = phishing_caught = phishing_missed = 0
    legit_total = legit_handled_well = legit_false_positive = 0
    action_breakdown: dict[str, ActionBreakdown] = {
        category: ActionBreakdown(legit_count=0, phishing_count=0) for category in SAFE_ACTION_MATRIX
    }
    legit_attachments_opened = phishing_attachments_opened = 0

    for interaction in interactions:
        email = emails_by_id.get(interaction.email_id)
        if email is None:
            continue

        truth_key = "phishing" if email.is_phishing else "legit"
        category = _category_for(interaction.action_taken, interaction.recipient, it_email)

        score = SAFE_ACTION_MATRIX[category][truth_key]
        best_score = max(row[truth_key] for row in SAFE_ACTION_MATRIX.values())

        total_score += score
        max_possible_score += best_score
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
            attachment_score = SAFE_ACTION_MATRIX["open_attachment"][truth_key]
            total_score += attachment_score
            if email.is_phishing:
                phishing_attachments_opened += 1
            else:
                legit_attachments_opened += 1

    return PerformanceReport(
        total_score=total_score,
        max_possible_score=max_possible_score,
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
    )
