import { z } from "zod";

export const personaSchema = z.enum(["retter", "taler"]);

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export function createChatRequestSchema(maxInputChars: number) {
  return z.object({
    persona: personaSchema,
    message: z.string().trim().min(1).max(maxInputChars),
    history: z.array(chatMessageSchema).max(24),
  });
}
