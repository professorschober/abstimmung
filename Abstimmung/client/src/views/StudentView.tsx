import { useEffect, useMemo, useState } from "react";
import { getSession, joinSession, submitAnswers } from "../services/api";
import type { PublicSession, Results } from "../types";

export function StudentView({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [session, setSession] = useState<PublicSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!initialCode) {
      return;
    }
    getSession(initialCode).then(setSession).catch(() => setMessage("Der Code wurde nicht gefunden."));
  }, [initialCode]);

  async function handleLoad() {
    setMessage("");
    try {
      setSession(await getSession(code));
    } catch {
      setMessage("Der Code wurde nicht gefunden.");
    }
  }

  async function handleJoin() {
    if (!session) {
      return;
    }
    setMessage("");
    try {
      const participant = await joinSession(session.code, name);
      setParticipantId(participant.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Beitritt nicht möglich.");
    }
  }

  async function handleSubmit() {
    if (!session || !participantId) {
      return;
    }

    const payload = session.questions.map((question) => ({
      questionId: question.id,
      optionIndex: answers[question.id]
    }));

    if (payload.some((answer) => answer.optionIndex === undefined)) {
      setMessage("Bitte beantworte alle Fragen.");
      return;
    }

    const response = await submitAnswers(session.code, participantId, payload);
    setResults(response.results);
    setMessage(session.type === "quiz" ? "Abgegeben. Dein Ergebnis steht unten." : "Danke, deine Stimme wurde gespeichert.");
  }

  const ownScore = useMemo(() => results?.quizScores.find((score) => score.participantId === participantId), [participantId, results]);

  return (
    <section className="student-layout">
      <div className="panel student-card">
        <p className="eyebrow">Teilnehmen</p>
        <h2>{session ? session.title : "Code eingeben"}</h2>

        {!session && (
          <div className="join-form">
            <label className="field">
              Session-Code
              <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="z.B. A1B2C3" />
            </label>
            <button className="primary" onClick={handleLoad}>
              Session laden
            </button>
          </div>
        )}

        {session && !participantId && (
          <div className="join-form">
            <p className="muted">Code {session.code}</p>
            <label className="field">
              Dein Name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Vorname" />
            </label>
            <button className="primary" onClick={handleJoin}>
              Beitreten
            </button>
          </div>
        )}

        {session && participantId && !results && (
          <div className="answer-list">
            {session.questions.map((question) => (
              <fieldset className="answer-question" key={question.id}>
                <legend>{question.text}</legend>
                {question.options.map((option, optionIndex) => (
                  <label className="answer-option" key={option}>
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === optionIndex}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>
            ))}
            <button className="primary wide" onClick={handleSubmit}>
              Antworten abgeben
            </button>
          </div>
        )}

        {message && <p className={message.includes("nicht") || message.includes("Bitte") ? "error" : "success"}>{message}</p>}

        {ownScore && (
          <div className="score-box">
            <span>{ownScore.percentage}%</span>
            <p>
              {ownScore.correct} von {ownScore.total} Antworten richtig
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
