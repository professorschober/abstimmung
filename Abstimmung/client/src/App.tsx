import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { createSession, getResults, getSession, joinSession, revealResults, submitAnswers } from "./api";
import type { ActivityType, PublicSession, Results } from "./types";

type DraftQuestion = {
  text: string;
  optionsText: string;
  correctOptionIndex: number;
};

const starterQuestions: Record<ActivityType, DraftQuestion[]> = {
  poll: [
    {
      text: "Wie gut hast du das heutige Thema verstanden?",
      optionsText: "Sehr gut\nGut\nTeilweise\nNoch nicht",
      correctOptionIndex: 0
    }
  ],
  quiz: [
    {
      text: "Welche Sprache wird fuer React-Komponenten haeufig verwendet?",
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

function getInitialCode() {
  const url = new URL(window.location.href);
  const pathMatch = window.location.pathname.match(/^\/join\/([^/]+)/);
  return (pathMatch?.[1] ?? url.searchParams.get("code") ?? "").toUpperCase();
}

function getJoinUrl(code: string) {
  return `${window.location.origin}/join/${code}`;
}

export default function App() {
  const [mode, setMode] = useState<"teacher" | "student">(getInitialCode() ? "student" : "teacher");

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Unterricht live</p>
          <h1>Abstimmung</h1>
        </div>
        <nav className="mode-switch" aria-label="Ansicht">
          <button className={mode === "teacher" ? "active" : ""} onClick={() => setMode("teacher")}>
            Lehrkraft
          </button>
          <button className={mode === "student" ? "active" : ""} onClick={() => setMode("student")}>
            Schueler
          </button>
        </nav>
      </header>

      {mode === "teacher" ? <TeacherView /> : <StudentView initialCode={getInitialCode()} />}
    </main>
  );
}

function TeacherView() {
  const [activityType, setActivityType] = useState<ActivityType>("poll");
  const [title, setTitle] = useState("Exit Ticket");
  const [questions, setQuestions] = useState<DraftQuestion[]>(starterQuestions.poll);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [message, setMessage] = useState("");

  const joinUrl = session ? getJoinUrl(session.code) : "";

  useEffect(() => {
    setQuestions(starterQuestions[activityType]);
    setTitle(activityType === "quiz" ? "Kurzquiz" : "Exit Ticket");
  }, [activityType]);

  useEffect(() => {
    if (!session) {
      return;
    }
    QRCode.toDataURL(joinUrl, { margin: 1, width: 256 }).then(setQrCode).catch(() => setQrCode(""));
  }, [joinUrl, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const interval = window.setInterval(async () => {
      const [freshSession, freshResults] = await Promise.all([getSession(session.code), getResults(session.code)]);
      setSession(freshSession);
      setResults(freshResults);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [session?.code]);

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((current) => current.map((question, itemIndex) => (itemIndex === index ? { ...question, ...patch } : question)));
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        text: "",
        optionsText: "Ja\nNein",
        correctOptionIndex: 0
      }
    ]);
  }

  async function handleCreate() {
    setMessage("");
    const payload = questions.map((question) => ({
      text: question.text,
      options: question.optionsText.split("\n").map((option) => option.trim()).filter(Boolean),
      correctOptionIndex: activityType === "quiz" ? question.correctOptionIndex : undefined
    }));

    try {
      const created = await createSession({ title, type: activityType, questions: payload });
      setSession(created);
      setResults(await getResults(created.code));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Die Session konnte nicht erstellt werden.");
    }
  }

  async function handleReveal() {
    if (!session) {
      return;
    }
    setResults(await revealResults(session.code));
    setSession(await getSession(session.code));
  }

  return (
    <section className="teacher-grid">
      <form className="panel editor" onSubmit={(event) => event.preventDefault()}>
        <div className="section-title">
          <div>
            <p className="eyebrow">Erstellen</p>
            <h2>Aktivitaet vorbereiten</h2>
          </div>
          <div className="segmented">
            <button type="button" className={activityType === "poll" ? "active" : ""} onClick={() => setActivityType("poll")}>
              Abstimmung
            </button>
            <button type="button" className={activityType === "quiz" ? "active" : ""} onClick={() => setActivityType("quiz")}>
              Quiz
            </button>
          </div>
        </div>

        <label className="field">
          Titel
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="z.B. Wiederholung Datenbanken" />
        </label>

        {questions.map((question, index) => (
          <div className="question-editor" key={index}>
            <label className="field">
              Frage {index + 1}
              <input value={question.text} onChange={(event) => updateQuestion(index, { text: event.target.value })} />
            </label>
            <label className="field">
              Antworten, eine pro Zeile
              <textarea value={question.optionsText} onChange={(event) => updateQuestion(index, { optionsText: event.target.value })} rows={4} />
            </label>
            {activityType === "quiz" && (
              <label className="field compact">
                Richtige Antwort
                <select
                  value={question.correctOptionIndex}
                  onChange={(event) => updateQuestion(index, { correctOptionIndex: Number(event.target.value) })}
                >
                  {question.optionsText.split("\n").filter(Boolean).map((option, optionIndex) => (
                    <option value={optionIndex} key={`${option}-${optionIndex}`}>
                      {optionIndex + 1}. {option}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        ))}

        <div className="actions">
          <button type="button" className="secondary" onClick={addQuestion}>
            Frage hinzufuegen
          </button>
          <button type="button" className="primary" onClick={handleCreate}>
            QR-Code erzeugen
          </button>
        </div>
        {message && <p className="error">{message}</p>}
      </form>

      <aside className="panel session-panel">
        {session ? (
          <>
            <div className="section-title">
              <div>
                <p className="eyebrow">Code {session.code}</p>
                <h2>{session.title}</h2>
              </div>
              <button className="primary" onClick={handleReveal}>
                Auswerten
              </button>
            </div>
            <div className="qr-box">{qrCode ? <img src={qrCode} alt={`QR-Code fuer ${joinUrl}`} /> : <span>QR-Code wird erzeugt</span>}</div>
            <p className="join-url">{joinUrl}</p>
            <div className="metrics">
              <Metric label="Teilnehmer" value={String(session.participants.length)} />
              <Metric label="Abgaben" value={String(results?.submissionCount ?? 0)} />
              <Metric label="Status" value={session.isRevealed ? "Ausgewertet" : "Aktiv"} />
            </div>
            {results && <ResultsView results={results} />}
          </>
        ) : (
          <div className="empty-state">
            <h2>Noch keine Session</h2>
            <p>Erstelle eine Abstimmung oder ein Quiz. Danach erscheint hier der QR-Code fuer die Klasse.</p>
          </div>
        )}
      </aside>
    </section>
  );
}

function StudentView({ initialCode }: { initialCode: string }) {
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
      setMessage(error instanceof Error ? error.message : "Beitritt nicht moeglich.");
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

function ResultsView({ results }: { results: Results }) {
  const maxCount = Math.max(1, ...results.answerCounts.flatMap((question) => question.counts.map((count) => count.count)));

  return (
    <div className="results">
      <h3>Ergebnisse</h3>
      {results.answerCounts.map((question) => (
        <div className="result-question" key={question.questionId}>
          <h4>{question.questionText}</h4>
          {question.counts.map((count) => {
            const isCorrect = results.type === "quiz" && question.correctOptionIndex === count.optionIndex;
            return (
              <div className="result-row" key={count.option}>
                <div className="result-label">
                  <span>{count.option}</span>
                  <strong>{count.count}</strong>
                </div>
                <div className="bar-track">
                  <div className={isCorrect ? "bar correct" : "bar"} style={{ width: `${(count.count / maxCount) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {results.type === "quiz" && results.quizScores.length > 0 && (
        <div className="leaderboard">
          <h4>Quizpunkte</h4>
          {results.quizScores
            .slice()
            .sort((a, b) => b.percentage - a.percentage)
            .map((score) => (
              <div className="score-row" key={score.participantId}>
                <span>{score.name}</span>
                <strong>
                  {score.correct}/{score.total}
                </strong>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
