import type { Contact, Credential, DummyEmail, TaskConfig } from "./types";

const BASE_URL = "http://127.0.0.1:8000";

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export function getEmails(participantId: string): Promise<DummyEmail[]> {
  return get(`/emails?participant_id=${encodeURIComponent(participantId)}`);
}

export function getContacts(): Promise<Contact[]> {
  return get("/contacts");
}

export function getTasks(): Promise<TaskConfig[]> {
  return get("/tasks");
}

export function getDepartments(): Promise<string[]> {
  return get("/departments");
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function patch(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}

export function startSession(
  participantId: string,
  participantFirstName: string,
  participantLastName: string,
  participantDepartment: string,
  sessionStartTs: number
) {
  return post("/session/start", {
    participant_id: participantId,
    participant_first_name: participantFirstName,
    participant_last_name: participantLastName,
    participant_department: participantDepartment,
    session_start_ts: sessionStartTs,
  });
}

export async function openInteraction(
  participantId: string,
  emailId: string,
  openedAt: number
): Promise<number> {
  const data = await post("/interactions/open", {
    participant_id: participantId,
    email_id: emailId,
    opened_at: openedAt,
  });
  return data.interaction_id;
}

export function confirmInteraction(
  interactionId: number,
  actionTaken: string,
  answerChanged: boolean,
  confirmedAt: number,
  timeToDecisionMs: number,
  recipient?: string | null
) {
  return patch(`/interactions/${interactionId}/confirm`, {
    action_taken: actionTaken,
    answer_changed: answerChanged,
    confirmed_at: confirmedAt,
    time_to_decision_ms: timeToDecisionMs,
    recipient: recipient ?? null,
  });
}

export function setConfidence(interactionId: number, confidenceRating: number) {
  return patch(`/interactions/${interactionId}/confidence`, {
    confidence_rating: confidenceRating,
  });
}

export function logHover(
  interactionId: number,
  target: string,
  startTs: number,
  endTs: number | null
) {
  return post(`/interactions/${interactionId}/hover`, {
    target,
    start_ts: startTs,
    end_ts: endTs,
  });
}

export interface KeystrokeEvent {
  participant_id: string;
  field_id: string;
  event_type: "keydown" | "keyup";
  key: string;
  timestamp_ms: number;
}

export function logKeystrokes(events: KeystrokeEvent[]) {
  if (events.length === 0) return Promise.resolve();
  return post("/events/keystroke", { events });
}

export interface MouseEventLog {
  participant_id: string;
  event_type: "move" | "down" | "up" | "click";
  x: number;
  y: number;
  target?: string;
  timestamp_ms: number;
}

export function logMouseEvents(events: MouseEventLog[]) {
  if (events.length === 0) return Promise.resolve();
  return post("/events/mouse", { events });
}

interface CredentialResponse {
  id: number;
  website: string;
  email: string;
  password: string;
  mfa_enabled: boolean;
}

function toCredential(data: CredentialResponse): Credential {
  return {
    id: data.id,
    website: data.website,
    email: data.email,
    password: data.password,
    mfaEnabled: data.mfa_enabled,
  };
}

export async function createCredential(
  participantId: string,
  website: string,
  email: string,
  password: string
): Promise<Credential> {
  const data = await post("/credentials", {
    participant_id: participantId,
    website,
    email,
    password,
    mfa_enabled: false,
  });
  return toCredential(data);
}

export async function updateCredentialPassword(
  credentialId: number,
  password: string
): Promise<Credential> {
  const data = await patch(`/credentials/${credentialId}`, { password });
  return toCredential(data);
}
