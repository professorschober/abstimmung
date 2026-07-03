import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ResultsView } from "../components/cards/ResultsView";
import { Metric } from "../components/common/Metric";
import { createSession, deleteSession, getResults, getSession, listSessions, revealResults } from "../services/api";
import { type DraftQuestion, starterQuestions } from "../stores/starterQuestions";
import type { ActivityType, PublicSession, Results } from "../types";
import { getJoinUrl } from "../utils/sessionLinks";

export function TeacherView() {
  const [activityType, setActivityType] = useState<ActivityType>("poll");
  const [title, setTitle] = useState("Exit Ticket");
  const [questions, setQuestions] = useState<DraftQuestion[]>(starterQuestions.poll);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [qrCode, setQrCode] = useState("");
  const [message, setMessage] = useState("");
  const [savedSessions, setSavedSessions] = useState<PublicSession[]>([]);

  const joinUrl = session ? getJoinUrl(session.code) : "";

  useEffect(() => {
    refreshSavedSessions();
  }, []);

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

  function startNewActivity(nextType: ActivityType) {
    setActivityType(nextType);
    setQuestions(starterQuestions[nextType]);
    setTitle(nextType === "quiz" ? "Neues Quiz" : "Neue Abstimmung");
    setSession(null);
    setResults(null);
    setQrCode("");
    setMessage("");
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

  async function refreshSavedSessions() {
    try {
      setSavedSessions(await listSessions());
    } catch {
      setSavedSessions([]);
    }
  }

  function loadSavedSession(savedSession: PublicSession) {
    setActivityType(savedSession.type);
    setTitle(savedSession.title);
    setQuestions(
      savedSession.questions.map((question) => ({
        text: question.text,
        optionsText: question.options.join("\n"),
        correctOptionIndex: question.correctOptionIndex ?? 0
      }))
    );
    setSession(null);
    setResults(null);
    setQrCode("");
    setMessage(`${savedSession.type === "quiz" ? "Quiz" : "Abstimmung"} "${savedSession.title}" wurde geladen.`);
  }

  async function handleDeleteSavedSession(savedSession: PublicSession) {
    const confirmed = window.confirm(`"${savedSession.title}" wirklich löschen?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteSession(savedSession.code);
      if (session?.code === savedSession.code) {
        setSession(null);
        setResults(null);
        setQrCode("");
      }
      await refreshSavedSessions();
      setMessage(`${savedSession.type === "quiz" ? "Quiz" : "Abstimmung"} "${savedSession.title}" wurde gelöscht.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Der Eintrag konnte nicht gelöscht werden.");
    }
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
      await refreshSavedSessions();
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
            <h2>Aktivität vorbereiten</h2>
          </div>
          <div className="segmented">
            <button type="button" className={activityType === "poll" ? "active" : ""} onClick={() => startNewActivity("poll")}>
              Abstimmung
            </button>
            <button type="button" className={activityType === "quiz" ? "active" : ""} onClick={() => startNewActivity("quiz")}>
              Quiz
            </button>
          </div>
        </div>

        <div className="new-activity-actions">
          <button type="button" className="secondary" onClick={() => startNewActivity("poll")}>
            Neue Abstimmung erstellen
          </button>
          <button type="button" className="secondary" onClick={() => startNewActivity("quiz")}>
            Neues Quiz erstellen
          </button>
        </div>

        <label className="field">
          {activityType === "quiz" ? "Name des Quiz" : "Name der Abstimmung"}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="z.B. Wiederholung Datenbanken" />
        </label>

        {savedSessions.length > 0 && (
          <section className="saved-library" aria-label="Gespeicherte Quizze und Abstimmungen">
            <div className="saved-library-header">
              <div>
                <p className="eyebrow">JSON-Datenbank</p>
                <h3>Gespeicherte Inhalte laden</h3>
              </div>
              <button type="button" className="secondary compact-button" onClick={refreshSavedSessions}>
                Aktualisieren
              </button>
            </div>
            <div className="saved-list">
              {savedSessions.map((savedSession) => (
                <div className="saved-item" key={savedSession.id}>
                  <button type="button" className="saved-load" onClick={() => loadSavedSession(savedSession)}>
                    <span>{savedSession.type === "quiz" ? "Quiz" : "Abstimmung"}</span>
                    <strong>{savedSession.title}</strong>
                    <small>
                      {savedSession.questions.length} Fragen · Code {savedSession.code}
                    </small>
                  </button>
                  <button type="button" className="danger compact-button" onClick={() => handleDeleteSavedSession(savedSession)}>
                    Löschen
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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
            Frage hinzufügen
          </button>
          <button type="button" className="primary" onClick={handleCreate}>
            Speichern und QR-Code erzeugen
          </button>
        </div>
        {message && <p className={message.includes("geladen") || message.includes("gelöscht") ? "success" : "error"}>{message}</p>}
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
            <div className="qr-box">{qrCode ? <img src={qrCode} alt={`QR-Code für ${joinUrl}`} /> : <span>QR-Code wird erzeugt</span>}</div>
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
            <p>Erstelle eine Abstimmung oder ein Quiz. Danach erscheint hier der QR-Code für die Klasse.</p>
          </div>
        )}
      </aside>
    </section>
  );
}
