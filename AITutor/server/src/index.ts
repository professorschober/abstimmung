import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { config, hasOpenAIKey, hasNvidiaKey } from "./config.js";
import { generateTutorReply as generateOpenAIReply } from "./openai.js";
import { generateTutorReply as generateGemmaReply } from "./gemma.js";
import { createChatRequestSchema } from "./schema.js";

const app = express();
const chatRequestSchema = createChatRequestSchema(config.MAX_INPUT_CHARS);

app.use(
    cors({
        origin: "*",
    }),
);

app.use(express.json({ limit: "1mb" }));

app.use(
    "/api",
    rateLimit({
        windowMs: 60 * 1000,
        limit: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            error: "Zu viele Anfragen in kurzer Zeit. Bitte gleich noch einmal versuchen.",
        },
    }),
);

app.get("/api/health", (_request, response) => {
    response.json({
        ok: true,
        provider: config.LLM_PROVIDER,
    });
});

app.post("/api/chat", async (request, response) => {
    const parsed = chatRequestSchema.safeParse(request.body);

    if (!parsed.success) {
        return response.status(400).json({
            error: "Ungueltige Anfrage.",
            details: parsed.error.flatten(),
        });
    }

    const { persona, message, history } = parsed.data;

    try {
        let result;

        if (config.LLM_PROVIDER === "gemma") {
            result = await generateGemmaReply(persona, history, message);
        } else {
            result = await generateOpenAIReply(persona, history, message);
        }

        return response.json({
            reply: result.reply,
            persona,
            refusal: result.refusal,
            provider: config.LLM_PROVIDER,
        });
    } catch (error) {
        console.error(`${config.LLM_PROVIDER} request failed`, error);

        return response.status(500).json({
            error:
                "Die KI-Antwort konnte gerade nicht erzeugt werden. Bitte pruefen Sie den Server und den API-Key.",
            provider: config.LLM_PROVIDER,
        });
    }
});

app.listen(config.PORT, () => {
    if (config.LLM_PROVIDER === "openai" && !hasOpenAIKey()) {
        console.warn(
            "OPENAI_API_KEY fehlt. Der Server startet trotzdem, aber Chat-Anfragen schlagen fehl, bis server/.env konfiguriert ist.",
        );
    }

    if (config.LLM_PROVIDER === "gemma" && !hasNvidiaKey()) {
        console.warn(
            "NVIDIA_API_KEY fehlt. Der Server startet trotzdem, aber Chat-Anfragen schlagen fehl, bis server/.env konfiguriert ist.",
        );
    }

    console.log("Allowed client origins: *");
    console.log(`LLM Provider: ${config.LLM_PROVIDER}`);
    console.log(`AI Tutor server listening on http://localhost:${config.PORT}`);
});