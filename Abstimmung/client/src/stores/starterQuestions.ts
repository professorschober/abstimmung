import type { ActivityType } from "../types";

export type DraftQuestion = {
  text: string;
  optionsText: string;
  correctOptionIndex: number;
};

export const starterQuestions: Record<ActivityType, DraftQuestion[]> = {
  poll: [
    {
      text: "Wie gut hast du das heutige Thema verstanden?",
      optionsText: "Sehr gut\nGut\nTeilweise\nNoch nicht",
      correctOptionIndex: 0
    }
  ],
  quiz: [
    {
      text: "Welche Sprache wird für React-Komponenten häufig verwendet?",
      optionsText: "TypeScript\nSQL\nBash\nMarkdown",
      correctOptionIndex: 0
    },
    {
      text: "Welches HTTP-Verb wird meist zum Erstellen verwendet?",
      optionsText: "POST\nGET\nTRACE\nHEAD",
      correctOptionIndex: 0
    }
  ]
};
