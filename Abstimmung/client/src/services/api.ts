import type { ActivityType, PublicSession, Results } from "../types";

type DraftQuestion = {
  text: string;
  options: string[];
  correctOptionIndex?: number;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Server request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function createSession(input: {
  title: string;
  type: ActivityType;
  questions: DraftQuestion[];
}): Promise<PublicSession> {
  return request<PublicSession>("/api/sessions", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function listSessions(): Promise<PublicSession[]> {
  return request<PublicSession[]>("/api/sessions");
}

export function getSession(code: string): Promise<PublicSession> {
  return request<PublicSession>(`/api/sessions/${encodeURIComponent(code)}`);
}

export async function deleteSession(code: string): Promise<void> {
  await request<void>(`/api/sessions/${encodeURIComponent(code)}`, {
    method: "DELETE"
  });
}

export function joinSession(code: string, name: string): Promise<{ id: string; name: string; joinedAt: string }> {
  return request(`/api/sessions/${encodeURIComponent(code)}/join`, {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function submitAnswers(
  code: string,
  participantId: string,
  answers: Array<{ questionId: string; optionIndex: number }>
): Promise<{ ok: true; results: Results }> {
  return request(`/api/sessions/${encodeURIComponent(code)}/answers`, {
    method: "POST",
    body: JSON.stringify({ participantId, answers })
  });
}

export function revealResults(code: string): Promise<Results> {
  return request<Results>(`/api/sessions/${encodeURIComponent(code)}/reveal`, {
    method: "POST"
  });
}

export function getResults(code: string): Promise<Results> {
  return request<Results>(`/api/sessions/${encodeURIComponent(code)}/results`);
}
