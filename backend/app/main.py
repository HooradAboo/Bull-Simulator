from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import models, schemas
from app.contacts import Contact, load_contacts, load_contacts_for_participant
from app.database import Base, engine, get_db
from app.emails import EmailPublic, build_template_context, load_public_emails
from app.participant_profile import ParticipantProfile, load_participant_profile
from app.self_efficacy import SelfEfficacyQuestion, load_self_efficacy_questions
from app.tasks import TaskConfig, load_tasks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Phishing Study Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/emails", response_model=list[EmailPublic])
def get_emails(participant_id: str | None = None, db: Session = Depends(get_db)):
    try:
        context = None
        if participant_id is not None:
            participant = db.get(models.Participant, participant_id)
            if not participant:
                raise HTTPException(status_code=404, detail="unknown participant_id")
            profile = load_participant_profile(participant.netid)
            context = build_template_context(
                participant.first_name,
                participant.last_name,
                participant.session_start_ts,
                contacts=profile.contacts if profile else None,
                variables=profile.variables if profile else None,
            )
        return load_public_emails(context)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/participant-profile/{netid}", response_model=ParticipantProfile)
def get_participant_profile(netid: str):
    profile = load_participant_profile(netid)
    if not profile:
        raise HTTPException(status_code=404, detail="no profile found for this netid")
    return profile


@app.get("/self-efficacy-questions", response_model=list[SelfEfficacyQuestion])
def get_self_efficacy_questions():
    try:
        return load_self_efficacy_questions()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/contacts", response_model=list[Contact])
def get_contacts(participant_id: str | None = None, db: Session = Depends(get_db)):
    try:
        if participant_id is None:
            return load_contacts()
        participant = db.get(models.Participant, participant_id)
        if not participant:
            raise HTTPException(status_code=404, detail="unknown participant_id")
        profile = load_participant_profile(participant.netid)
        return load_contacts_for_participant(profile)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks", response_model=list[TaskConfig])
def get_tasks():
    try:
        return load_tasks()
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/session/start")
def start_session(payload: schemas.SessionStart, db: Session = Depends(get_db)):
    existing = db.get(models.Participant, payload.participant_id)
    if existing:
        raise HTTPException(status_code=409, detail="participant_id already exists")

    participant = models.Participant(
        id=payload.participant_id,
        first_name=payload.participant_first_name,
        last_name=payload.participant_last_name,
        netid=payload.netid,
        self_efficacy_recognize_links=payload.self_efficacy_recognize_links,
        self_efficacy_verify_legitimacy=payload.self_efficacy_verify_legitimacy,
        self_efficacy_avoid_suspicious=payload.self_efficacy_avoid_suspicious,
        self_efficacy_verify_trusted_source=payload.self_efficacy_verify_trusted_source,
        self_efficacy_report_phishing=payload.self_efficacy_report_phishing,
        self_efficacy_recovery_steps=payload.self_efficacy_recovery_steps,
        session_start_ts=payload.session_start_ts,
    )
    db.add(participant)
    db.add(
        models.SessionEvent(
            participant_id=payload.participant_id,
            event_type="session_start",
            timestamp_ms=payload.session_start_ts,
        )
    )
    db.commit()
    return {"status": "ok"}


@app.patch("/participants/{participant_id}/self-efficacy-post")
def set_self_efficacy_post(
    participant_id: str, payload: schemas.SelfEfficacyPost, db: Session = Depends(get_db)
):
    participant = db.get(models.Participant, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="unknown participant_id")

    participant.self_efficacy_post_recognize_links = payload.self_efficacy_post_recognize_links
    participant.self_efficacy_post_verify_legitimacy = payload.self_efficacy_post_verify_legitimacy
    participant.self_efficacy_post_avoid_suspicious = payload.self_efficacy_post_avoid_suspicious
    participant.self_efficacy_post_verify_trusted_source = (
        payload.self_efficacy_post_verify_trusted_source
    )
    participant.self_efficacy_post_report_phishing = payload.self_efficacy_post_report_phishing
    participant.self_efficacy_post_recovery_steps = payload.self_efficacy_post_recovery_steps
    db.commit()
    return {"status": "ok"}


@app.post("/interactions/open", response_model=schemas.InteractionOpenResponse)
def open_interaction(payload: schemas.InteractionOpen, db: Session = Depends(get_db)):
    if not db.get(models.Participant, payload.participant_id):
        raise HTTPException(status_code=404, detail="unknown participant_id")

    interaction = models.EmailInteraction(
        participant_id=payload.participant_id,
        email_id=payload.email_id,
        opened_at=payload.opened_at,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return schemas.InteractionOpenResponse(interaction_id=interaction.id)


@app.patch("/interactions/{interaction_id}/confirm")
def confirm_interaction(
    interaction_id: int, payload: schemas.InteractionConfirm, db: Session = Depends(get_db)
):
    interaction = db.get(models.EmailInteraction, interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="unknown interaction_id")

    interaction.action_taken = payload.action_taken
    interaction.answer_changed = payload.answer_changed
    interaction.confirmed_at = payload.confirmed_at
    interaction.time_to_decision_ms = payload.time_to_decision_ms
    interaction.recipient = payload.recipient
    db.commit()
    return {"status": "ok"}


@app.patch("/interactions/{interaction_id}/ratings")
def set_interaction_ratings(
    interaction_id: int, payload: schemas.InteractionRatings, db: Session = Depends(get_db)
):
    interaction = db.get(models.EmailInteraction, interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="unknown interaction_id")

    interaction.confidence_rating = payload.confidence_rating
    interaction.difficulty_rating = payload.difficulty_rating
    interaction.cues_noticed = payload.cues_noticed
    interaction.cues_other_text = payload.cues_other_text
    db.commit()
    return {"status": "ok"}


@app.post("/interactions/{interaction_id}/hover")
def log_hover(interaction_id: int, payload: schemas.HoverEventIn, db: Session = Depends(get_db)):
    if not db.get(models.EmailInteraction, interaction_id):
        raise HTTPException(status_code=404, detail="unknown interaction_id")

    hover = models.HoverEvent(
        interaction_id=interaction_id,
        target=payload.target,
        start_ts=payload.start_ts,
        end_ts=payload.end_ts,
    )
    db.add(hover)
    db.commit()
    return {"status": "ok"}


@app.post("/events/keystroke")
def log_keystrokes(payload: schemas.KeystrokeBatch, db: Session = Depends(get_db)):
    db.bulk_save_objects(
        [models.KeystrokeEvent(**event.model_dump()) for event in payload.events]
    )
    db.commit()
    return {"status": "ok", "count": len(payload.events)}


@app.post("/events/mouse")
def log_mouse(payload: schemas.MouseBatch, db: Session = Depends(get_db)):
    db.bulk_save_objects(
        [models.MouseEvent(**event.model_dump()) for event in payload.events]
    )
    db.commit()
    return {"status": "ok", "count": len(payload.events)}


@app.post("/credentials", response_model=schemas.CredentialOut)
def create_credential(payload: schemas.CredentialCreate, db: Session = Depends(get_db)):
    if not db.get(models.Participant, payload.participant_id):
        raise HTTPException(status_code=404, detail="unknown participant_id")

    credential = models.Credential(
        participant_id=payload.participant_id,
        website=payload.website,
        email=payload.email,
        password=payload.password,
        mfa_enabled=payload.mfa_enabled,
    )
    db.add(credential)
    db.commit()
    db.refresh(credential)
    return credential


@app.patch("/credentials/{credential_id}", response_model=schemas.CredentialOut)
def update_credential(
    credential_id: int, payload: schemas.CredentialUpdate, db: Session = Depends(get_db)
):
    credential = db.get(models.Credential, credential_id)
    if not credential:
        raise HTTPException(status_code=404, detail="unknown credential_id")

    credential.password = payload.password
    db.commit()
    db.refresh(credential)
    return credential
