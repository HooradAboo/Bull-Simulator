from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import models, schemas
from app.contacts import Contact, load_contacts
from app.database import Base, engine, get_db
from app.emails import EmailPublic, load_public_emails
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
def get_emails():
    try:
        return load_public_emails()
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/contacts", response_model=list[Contact])
def get_contacts():
    try:
        return load_contacts()
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


@app.patch("/interactions/{interaction_id}/confidence")
def set_confidence(
    interaction_id: int, payload: schemas.InteractionConfidence, db: Session = Depends(get_db)
):
    interaction = db.get(models.EmailInteraction, interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="unknown interaction_id")

    interaction.confidence_rating = payload.confidence_rating
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
