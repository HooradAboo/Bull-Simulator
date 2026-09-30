import type { Contact, Credential, DummyEmail, SelfEfficacyRatings } from "./types";

const BASE_URL = "http://127.0.0.1:8000";

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

interface EmailResponse {
  id: string;
  sender: string;
  subject: string;
  body: string;
  link: string | null;
  attachment: string | null;
  received_at: number | null;
}

export async function getEmails(participantId: string): Promise<DummyEmail[]> {
  const data: EmailResponse[] = await get(
    `/emails?participant_id=${encodeURIComponent(participantId)}`
  );
  return data.map((e) => ({
    id: e.id,
    sender: e.sender,
    subject: e.subject,
    body: e.body,
    link: e.link,
    attachment: e.attachment,
    receivedAt: e.received_at,
  }));
}

export function getContacts(participantId: string): Promise<Contact[]> {
  return get(`/contacts?participant_id=${encodeURIComponent(participantId)}`);
}

export interface ActionReasonOption {
  key: string;
  label: string;
}

export function getActionReasons(): Promise<Record<string, ActionReasonOption[]>> {
  return get("/action-reasons");
}

export interface CueOption {
  key: string;
  label: string;
}

export function getCueOptions(): Promise<CueOption[]> {
  return get("/cue-options");
}

export interface ParticipantProfile {
  netid: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function getParticipantProfile(netid: string): Promise<ParticipantProfile | null> {
  const res = await fetch(`${BASE_URL}/participant-profile/${encodeURIComponent(netid)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /participant-profile/${netid} failed: ${res.status}`);
  return res.json();
}

export interface CompletedInteractionSummary {
  emailId: string;
  actionTaken: string;
  confidenceRating: number;
  recipient: string | null;
}

export interface ParticipantLookup {
  participantId: string;
  firstName: string;
  lastName: string;
  netid: string;
  selfEfficacyPostSubmitted: boolean;
  completedInteractions: CompletedInteractionSummary[];
}

interface ParticipantLookupResponse {
  participant_id: string;
  first_name: string;
  last_name: string;
  netid: string;
  self_efficacy_post_submitted: boolean;
  completed_interactions: {
    email_id: string;
    action_taken: string;
    confidence_rating: number;
    recipient: string | null;
  }[];
}

export async function lookupParticipantByNetid(netid: string): Promise<ParticipantLookup | null> {
  const res = await fetch(`${BASE_URL}/participants/by-netid/${encodeURIComponent(netid)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /participants/by-netid/${netid} failed: ${res.status}`);
  const data: ParticipantLookupResponse = await res.json();
  return {
    participantId: data.participant_id,
    firstName: data.first_name,
    lastName: data.last_name,
    netid: data.netid,
    selfEfficacyPostSubmitted: data.self_efficacy_post_submitted,
    completedInteractions: data.completed_interactions.map((c) => ({
      emailId: c.email_id,
      actionTaken: c.action_taken,
      confidenceRating: c.confidence_rating,
      recipient: c.recipient,
    })),
  };
}

export interface SelfEfficacyQuestion {
  key: string;
  text: string;
}

export function getSelfEfficacyQuestions(): Promise<SelfEfficacyQuestion[]> {
  return get("/self-efficacy-questions");
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
  netid: string,
  selfEfficacy: SelfEfficacyRatings,
  sessionStartTs: number
) {
  return post("/session/start", {
    participant_id: participantId,
    participant_first_name: participantFirstName,
    participant_last_name: participantLastName,
    netid: netid,
    self_efficacy_recognize_links: selfEfficacy.recognizeLinks,
    self_efficacy_verify_legitimacy: selfEfficacy.verifyLegitimacy,
    self_efficacy_avoid_suspicious: selfEfficacy.avoidSuspicious,
    self_efficacy_verify_trusted_source: selfEfficacy.verifyTrustedSource,
    self_efficacy_report_phishing: selfEfficacy.reportPhishing,
    self_efficacy_recovery_steps: selfEfficacy.recoverySteps,
    session_start_ts: sessionStartTs,
  });
}

export function submitPostSelfEfficacy(participantId: string, ratings: SelfEfficacyRatings) {
  return patch(`/participants/${participantId}/self-efficacy-post`, {
    self_efficacy_post_recognize_links: ratings.recognizeLinks,
    self_efficacy_post_verify_legitimacy: ratings.verifyLegitimacy,
    self_efficacy_post_avoid_suspicious: ratings.avoidSuspicious,
    self_efficacy_post_verify_trusted_source: ratings.verifyTrustedSource,
    self_efficacy_post_report_phishing: ratings.reportPhishing,
    self_efficacy_post_recovery_steps: ratings.recoverySteps,
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

export type PerceivedLegitimacy = "trust" | "suspicious";

export interface InteractionRatings {
  perceivedLegitimacy: PerceivedLegitimacy;
  judgmentConfidenceRating: number;
  confidenceRating: number;
  cuesNoticed: string[];
  cuesOtherText: string | null;
}

export function submitInteractionRatings(interactionId: number, ratings: InteractionRatings) {
  return patch(`/interactions/${interactionId}/ratings`, {
    perceived_legitimacy: ratings.perceivedLegitimacy,
    judgment_confidence_rating: ratings.judgmentConfidenceRating,
    confidence_rating: ratings.confidenceRating,
    cues_noticed: ratings.cuesNoticed,
    cues_other_text: ratings.cuesOtherText,
  });
}

export interface PerformanceReport {
  phishing: { total: number; caught: number; missed: number };
  legit: { total: number; handledWell: number; falsePositive: number };
  actionBreakdown: Record<string, { legitCount: number; phishingCount: number }>;
}

interface PerformanceReportResponse {
  phishing: { total: number; caught: number; missed: number };
  legit: { total: number; handled_well: number; false_positive: number };
  action_breakdown: Record<string, { legit_count: number; phishing_count: number }>;
}

export async function getPerformanceReport(participantId: string): Promise<PerformanceReport> {
  const data: PerformanceReportResponse = await get(
    `/participants/${encodeURIComponent(participantId)}/report`
  );
  return {
    phishing: data.phishing,
    legit: {
      total: data.legit.total,
      handledWell: data.legit.handled_well,
      falsePositive: data.legit.false_positive,
    },
    actionBreakdown: Object.fromEntries(
      Object.entries(data.action_breakdown).map(([key, value]) => [
        key,
        { legitCount: value.legit_count, phishingCount: value.phishing_count },
      ])
    ),
  };
}

export interface ComposeFollowup {
  recipientRole: string;
  recipientRoleOtherText: string | null;
  reasons: string[];
  reasonsOtherText: string | null;
}

export function logComposedEmail(
  participantId: string,
  recipient: string,
  subject: string,
  body: string,
  composedAt: number,
  followup: ComposeFollowup
) {
  return post("/events/compose-email", {
    participant_id: participantId,
    recipient,
    subject,
    body,
    composed_at: composedAt,
    recipient_role: followup.recipientRole,
    recipient_role_other_text: followup.recipientRoleOtherText,
    reasons: followup.reasons,
    reasons_other_text: followup.reasonsOtherText,
  });
}

export function getContactRoles(): Promise<CueOption[]> {
  return get("/contact-roles");
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
