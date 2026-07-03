export type PersonaId = "retter" | "taler";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  persona: PersonaId;
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  persona: PersonaId;
  refusal?: {
    reason: string;
  };
}
