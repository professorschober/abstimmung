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

export type Answer = {
  participantId: string;
  questionId: string;
  optionIndex: number;
};

export type Session = {
  id: string;
  code: string;
  title: string;
  type: ActivityType;
  questions: Question[];
  participants: Participant[];
  answers: Answer[];
  isRevealed: boolean;
  createdAt: string;
};

export type PublicSession = Omit<Session, "answers"> & {
  submittedParticipantIds: string[];
};
