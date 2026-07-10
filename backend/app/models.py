from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from app.database import Base


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    first_name: Mapped[str] = mapped_column(String)
    last_name: Mapped[str] = mapped_column(String)
    session_start_ts: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    interactions: Mapped[list["EmailInteraction"]] = relationship(back_populates="participant")


class EmailInteraction(Base):
    __tablename__ = "email_interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"))
    email_id: Mapped[str] = mapped_column(String)

    opened_at: Mapped[int] = mapped_column(BigInteger)
    action_taken: Mapped[str | None] = mapped_column(String, nullable=True)
    answer_changed: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    time_to_decision_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confirmed_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    recipient: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    participant: Mapped["Participant"] = relationship(back_populates="interactions")
    hover_events: Mapped[list["HoverEvent"]] = relationship(back_populates="interaction")


class HoverEvent(Base):
    __tablename__ = "hover_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    interaction_id: Mapped[int] = mapped_column(ForeignKey("email_interactions.id"))
    target: Mapped[str] = mapped_column(String)
    start_ts: Mapped[int] = mapped_column(BigInteger)
    end_ts: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    interaction: Mapped["EmailInteraction"] = relationship(back_populates="hover_events")


class KeystrokeEvent(Base):
    __tablename__ = "keystroke_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"))
    field_id: Mapped[str] = mapped_column(String)
    event_type: Mapped[str] = mapped_column(String)  # keydown | keyup
    key: Mapped[str] = mapped_column(String)
    timestamp_ms: Mapped[int] = mapped_column(BigInteger)


class MouseEvent(Base):
    __tablename__ = "mouse_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"))
    event_type: Mapped[str] = mapped_column(String)  # move | down | up | click
    x: Mapped[int] = mapped_column(Integer)
    y: Mapped[int] = mapped_column(Integer)
    target: Mapped[str | None] = mapped_column(String, nullable=True)
    timestamp_ms: Mapped[int] = mapped_column(BigInteger)


class Credential(Base):
    """Simulated password-manager entry. Starts as email/derived-password
    at login; password gets overwritten if the participant chooses to
    change it after logging in.
    """

    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"))
    website: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String)
    password: Mapped[str] = mapped_column(String)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SessionEvent(Base):
    """Transition-point markers (session start/end, email opened).
    Populated fully in build step 5 (visible sync markers); step 1 only
    writes the session_start event.
    """

    __tablename__ = "session_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    participant_id: Mapped[str] = mapped_column(ForeignKey("participants.id"))
    event_type: Mapped[str] = mapped_column(String)  # session_start | email_opened | session_end
    timestamp_ms: Mapped[int] = mapped_column(BigInteger)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
