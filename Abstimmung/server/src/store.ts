import { randomBytes, randomUUID } from "node:crypto";
import type { Answer, Participant, PublicSession, Question, Session } from "./types.js";

const sessions = new Map<string, Session>();

function createCode(): string {
  let code = "";
  do {
    code = randomBytes(3).toString("hex").toUpperCase();
  } while (sessions.has(code));
  return code;
}

export function createSession(input: {
  title: string;
  type: "quiz" | "poll";
  questions: Array<{ text: string; options: string[]; correctOptionIndex?: number }>;
}): Session {
  const questions: Question[] = input.questions.map((question) => ({
    id: randomUUID(),
    text: question.text.trim(),
    options: question.options.map((option) => option.trim()).filter(Boolean),
    correctOptionIndex: question.correctOptionIndex
  }));

  const session: Session = {
    id: randomUUID(),
    code: createCode(),
    title: input.title.trim(),
    type: input.type,
    questions,
    participants: [],
    answers: [],
    isRevealed: false,
    createdAt: new Date().toISOString()
  };

  sessions.set(session.code, session);
  return session;
}

export function getSession(code: string): Session | undefined {
  return sessions.get(code.toUpperCase());
}

export function listSessions(): Session[] {
  return [...sessions.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function toPublicSession(session: Session): PublicSession {
  return {
    ...session,
    submittedParticipantIds: [...new Set(session.answers.map((answer) => answer.participantId))]
  };
}

export function joinSession(session: Session, name: string): Participant {
  const participant: Participant = {
    id: randomUUID(),
    name: name.trim(),
    joinedAt: new Date().toISOString()
  };
  session.participants.push(participant);
  return participant;
}

export function submitAnswers(session: Session, participantId: string, answers: Omit<Answer, "participantId">[]): void {
  if (!session.participants.some((participant) => participant.id === participantId)) {
    throw new Error("Unknown participant");
  }

  const validQuestionIds = new Set(session.questions.map((question) => question.id));
  const sanitizedAnswers = answers.map((answer) => {
    const question = session.questions.find((item) => item.id === answer.questionId);
    if (!question || !validQuestionIds.has(answer.questionId)) {
      throw new Error("Unknown question");
    }
    if (answer.optionIndex < 0 || answer.optionIndex >= question.options.length) {
      throw new Error("Invalid option");
    }
    return {
      participantId,
      questionId: answer.questionId,
      optionIndex: answer.optionIndex
    };
  });

  session.answers = session.answers.filter((answer) => answer.participantId !== participantId);
  session.answers.push(...sanitizedAnswers);
}

export function revealSession(session: Session): void {
  session.isRevealed = true;
}

export function getResults(session: Session) {
  const answerCounts = session.questions.map((question) => {
    const counts = question.options.map((option, optionIndex) => ({
      option,
      optionIndex,
      count: session.answers.filter(
        (answer) => answer.questionId === question.id && answer.optionIndex === optionIndex
      ).length
    }));

    return {
      questionId: question.id,
      questionText: question.text,
      correctOptionIndex: question.correctOptionIndex,
      counts
    };
  });

  const quizScores = session.participants.map((participant) => {
    const participantAnswers = session.answers.filter((answer) => answer.participantId === participant.id);
    const correct = participantAnswers.filter((answer) => {
      const question = session.questions.find((item) => item.id === answer.questionId);
      return question?.correctOptionIndex === answer.optionIndex;
    }).length;

    return {
      participantId: participant.id,
      name: participant.name,
      correct,
      total: session.questions.length,
      percentage: session.questions.length === 0 ? 0 : Math.round((correct / session.questions.length) * 100)
    };
  });

  return {
    code: session.code,
    title: session.title,
    type: session.type,
    isRevealed: session.isRevealed,
    participantCount: session.participants.length,
    submissionCount: new Set(session.answers.map((answer) => answer.participantId)).size,
    answerCounts,
    quizScores
  };
}
