export type ActivityType = "quiz" | "poll";

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex?: number;
};

export type Participant = {
  id: string;
  name: string;
  joinedAt: string;
};

export type PublicSession = {
  id: string;
  code: string;
  title: string;
  type: ActivityType;
  questions: Question[];
  participants: Participant[];
  submittedParticipantIds: string[];
  isRevealed: boolean;
  createdAt: string;
};

export type Results = {
  code: string;
  title: string;
  type: ActivityType;
  isRevealed: boolean;
  participantCount: number;
  submissionCount: number;
  answerCounts: Array<{
    questionId: string;
    questionText: string;
    correctOptionIndex?: number;
    counts: Array<{
      option: string;
      optionIndex: number;
      count: number;
    }>;
  }>;
  quizScores: Array<{
    participantId: string;
    name: string;
    correct: number;
    total: number;
    percentage: number;
  }>;
};
