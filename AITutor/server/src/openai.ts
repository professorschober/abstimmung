import OpenAI from "openai";
import { config, hasOpenAIKey } from "./config.js";
import { getSystemPrompt } from "./prompts.js";
import type { ChatMessage, PersonaId } from "./types.js";

let client: OpenAI | null = null;

const refusalPattern =
  /(erd|entity[- ]?relationship|entitaet|entit[aä]t|attribut|kardinalit[aä]t|fremdschl[uü]ssel|prim[aä]rschl[uü]ssel|datenmodell|tabellenstruktur)/i;

function historyToInput(history: ChatMessage[]) {
  return history.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function getClient(): OpenAI {
  if (!hasOpenAIKey()) {
    throw new Error(
      "OPENAI_API_KEY fehlt. Bitte kopieren Sie server/.env.example nach server/.env und tragen Sie dort Ihren OpenAI API-Key ein.",
    );
  }

  if (!client) {
    client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  return client;
}

export async function generateTutorReply(persona: PersonaId, history: ChatMessage[], message: string) {
  const response = await getClient().responses.create({
    model: config.OPENAI_MODEL,
    instructions: getSystemPrompt(persona),
    max_output_tokens: 220,
    input: [
      ...historyToInput(history),
      {
        role: "user",
        content: message,
      },
    ],
  });

  const reply = response.output_text.trim();
  const refusal = refusalPattern.test(message)
    ? {
        reason: "Die Frage zielt direkt auf Datenbankmodellierung oder ein ERD ab.",
      }
    : undefined;

  return {
    reply,
    refusal,
  };
}
