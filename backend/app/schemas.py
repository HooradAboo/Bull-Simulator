from pydantic import BaseModel


class SessionStart(BaseModel):
    participant_id: str
    participant_first_name: str
    participant_last_name: str
    session_start_ts: int


class InteractionOpen(BaseModel):
    participant_id: str
    email_id: str
    opened_at: int


class InteractionOpenResponse(BaseModel):
    interaction_id: int


class InteractionConfirm(BaseModel):
    action_taken: str
    answer_changed: bool
    confirmed_at: int
    time_to_decision_ms: int
    recipient: str | None = None


class InteractionConfidence(BaseModel):
    confidence_rating: int


class HoverEventIn(BaseModel):
    target: str
    start_ts: int
    end_ts: int | None = None


class KeystrokeEventIn(BaseModel):
    participant_id: str
    field_id: str
    event_type: str
    key: str
    timestamp_ms: int


class KeystrokeBatch(BaseModel):
    events: list[KeystrokeEventIn]


class MouseEventIn(BaseModel):
    participant_id: str
    event_type: str
    x: int
    y: int
    target: str | None = None
    timestamp_ms: int


class MouseBatch(BaseModel):
    events: list[MouseEventIn]


class CredentialCreate(BaseModel):
    participant_id: str
    website: str
    email: str
    password: str
    mfa_enabled: bool = False


class CredentialUpdate(BaseModel):
    password: str


class CredentialOut(BaseModel):
    id: int
    website: str
    email: str
    password: str
    mfa_enabled: bool

    model_config = {"from_attributes": True}
