import axios from "axios";
import { config } from "./config.js";
import { getSystemPrompt } from "./prompts.js";
import type { ChatMessage, PersonaId } from "./types.js";

const refusalPattern =
    /(erd|entity[- ]?relationship|entitaet|entit[aä]t|attribut|kardinalit[aä]t|fremdschl[uü]ssel|prim[aä]rschl[uü]ssel|datenmodell|tabellenstruktur)/i;

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";

type NvidiaChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

type NvidiaChatCompletionResponse = {
    id?: string;
    object?: string;
    created?: number;
    model?: string;
    choices?: Array<{
        index?: number;
        message?: {
            role?: string;
            content?: string;
        };
        finish_reason?: string;
    }>;
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
};

function hasGemmaKey(): boolean {
    return typeof config.NVIDIA_API_KEY === "string" && config.NVIDIA_API_KEY.trim().length > 0;
}

function historyToMessages(history: ChatMessage[]): NvidiaChatMessage[] {
    return history.map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
    }));
}

function getHeaders() {
    if (!hasGemmaKey()) {
        throw new Error(
            "NVIDIA_API_KEY fehlt. Bitte tragen Sie Ihren NVIDIA API-Key in der Konfiguration bzw. .env-Datei ein.",
        );
    }

    return {
        Authorization: `Bearer ${config.NVIDIA_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
    };
}

function extractReply(data: NvidiaChatCompletionResponse): string {
    const content = data.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
        throw new Error("Die Gemma-Antwort enthält keinen gültigen Textinhalt.");
    }

    return content.trim();
}

export async function generateTutorReply(
    persona: PersonaId,
    history: ChatMessage[],
    message: string,
) {
    const payload = {
        model: config.GEMMA_MODEL ?? "google/gemma-4-31b-it",
        messages: [
            {
                role: "system",
                content: getSystemPrompt(persona),
            },
            ...historyToMessages(history),
            {
                role: "user",
                content: message,
            },
        ],
        max_tokens: 220,
        temperature: 1.0,
        top_p: 0.95,
        stream: false,
        chat_template_kwargs: {
            enable_thinking: true,
        },
    };

    const response = await axios.post<NvidiaChatCompletionResponse>(invokeUrl, payload, {
        headers: getHeaders(),
        responseType: "json",
    });

    const reply = extractReply(response.data);

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