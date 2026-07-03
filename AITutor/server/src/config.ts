import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const configSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3001),
    CLIENT_ORIGINS: z.string().default("http://localhost:5173"),

    OPENAI_API_KEY: z.string().trim().min(1).optional(),
    OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),

    NVIDIA_API_KEY: z.string().trim().min(1).optional(),
    GEMMA_MODEL: z.string().min(1).default("google/gemma-4-31b-it"),

    LLM_PROVIDER: z.enum(["openai", "gemma"]).default("openai"),

    MAX_INPUT_CHARS: z.coerce.number().int().positive().default(1500),
});

const rawConfig = configSchema.parse(process.env);

const parsedOrigins = rawConfig.CLIENT_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

parsedOrigins.forEach((origin) => z.string().url().parse(origin));

export const config = {
    ...rawConfig,
    CLIENT_ORIGINS: parsedOrigins,

    OPENAI_API_KEY: rawConfig.OPENAI_API_KEY ?? "",
    OPENAI_MODEL: rawConfig.OPENAI_MODEL,

    NVIDIA_API_KEY: rawConfig.NVIDIA_API_KEY ?? "",
    GEMMA_MODEL: rawConfig.GEMMA_MODEL,

    LLM_PROVIDER: rawConfig.LLM_PROVIDER,
};

export function hasOpenAIKey(): boolean {
    return Boolean(
        config.OPENAI_API_KEY &&
        config.OPENAI_API_KEY !== "your_openai_api_key_here",
    );
}

export function hasNvidiaKey(): boolean {
    return Boolean(
        config.NVIDIA_API_KEY &&
        config.NVIDIA_API_KEY !== "your_nvidia_api_key_here",
    );
}