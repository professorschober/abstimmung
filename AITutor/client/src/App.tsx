import { FormEvent, useMemo, useState } from "react";
import { getPersona, personas } from "./personaData";
import type { ChatMessage, ChatResponse, PersonaId } from "./types";
import leitstelleLogo from "./assets/leitstelle-rotes-kreuz-lebring.svg";
import cardinalityLogo from "./assets/cardinality-consulting.svg";

type Conversations = Record<PersonaId, ChatMessage[]>;
type Refusals = Partial<Record<PersonaId, string>>;
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

const initialConversations: Conversations = {
  retter: [],
  taler: [],
};

const starterPrompts = [
    "Fragt nach den Rollen, Aufgaben und Begriffen aus dem Alltag des Roten Kreuzes Lebring.",
    "Klärt die Abläufe und erstellt daraus ein ERD-Diagramm und ein ERD-Modell.",
];

export default function App() {
  const [activePersona, setActivePersona] = useState<PersonaId>("retter");
  const [conversations, setConversations] = useState<Conversations>(initialConversations);
  const [refusals, setRefusals] = useState<Refusals>({});
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persona = useMemo(() => getPersona(activePersona), [activePersona]);
  const activeMessages = conversations[activePersona];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isLoading) {
      return;
    }

    const nextHistory = [...activeMessages, { role: "user", content: message } satisfies ChatMessage];
    setConversations((current) => ({
      ...current,
      [activePersona]: nextHistory,
    }));
    setDraft("");
    setError(null);
    setRefusals((current) => ({ ...current, [activePersona]: undefined }));
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona: activePersona,
          message,
          history: activeMessages,
        }),
      });

      const payload = (await response.json()) as ChatResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Die Anfrage konnte nicht verarbeitet werden.");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: payload.reply,
      };

      setConversations((current) => ({
        ...current,
        [activePersona]: [...current[activePersona], assistantMessage],
      }));
      setRefusals((current) => ({
        ...current,
        [activePersona]: payload.refusal?.reason,
      }));
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error
          ? caughtError.message
          : "Es ist ein unerwarteter Fehler aufgetreten.";
      setError(messageText);
      setConversations((current) => ({
        ...current,
        [activePersona]: current[activePersona].slice(0, -1),
      }));
      setDraft(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="hero-card">
          <img
            src={leitstelleLogo}
            alt="Leitstelle Rotes Kreuz Lebring"
            className="hero-logo"
          />
          <p className="eyebrow">Modellierungssimulation</p>
          <h3>AI-Tutor für ERD</h3>
          <p>
            Ihr arbeitet als Datenbankmodellierer in der <strong>Firma Cardinality Consulting</strong> und
            erhebt Anforderungen für das Rote Kreuz Lebring.
          </p>

        </div>

        <section className="panel">
          {/*<h2>Personas</h2>*/}
          <div className="persona-list">
            {personas.map((entry) => {
              const isActive = entry.id === activePersona;
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`persona-card ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setActivePersona(entry.id);
                    setError(null);
                  }}
                >
                  <span className="persona-dot" style={{ backgroundColor: entry.accent }} />
                  <span>
                    <strong>{entry.name}</strong>
                    <small>{entry.title}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <h2>Arbeitsauftrag</h2>
          <ul>
            {starterPrompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
            <img
                src={cardinalityLogo}
                alt="Cardinality Consulting"
                className="hero-secondary-image"
            />
        </section>
      </aside>

      <main className="main-stage">
        <section className="stage-header panel">
          <div>
            <p className="eyebrow">Aktive Persona</p>
            <h2>{persona.name}</h2>
            <p>{persona.summary}</p>
          </div>
          <div className="example-box">
            <strong>Sinnvolle Fragen</strong>
            <ul>
              {persona.questionExamples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="chat-panel panel">
          <div className="chat-log" aria-live="polite">
            {activeMessages.length === 0 ? (
              <div className="empty-state">
                <h3>Interview starten</h3>
                <p>
                  Formuliert eure erste fachliche Frage an {persona.name}. Die Persona
                  antwortet nur innerhalb ihrer Rolle beim Roten Kreuz Lebring.
                </p>
              </div>
            ) : (
              activeMessages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                  <p className="bubble-label">
                    {message.role === "user" ? "Sie" : persona.name}
                  </p>
                  <p>{message.content}</p>
                </article>
              ))
            )}

            {isLoading ? (
              <article className="bubble assistant pending">
                <p className="bubble-label">{persona.name}</p>
                  <p>{persona.name} denkt über die fachliche Rückmeldung nach ...</p>
              </article>
            ) : null}
          </div>

          <form className="composer" onSubmit={handleSubmit}>
            <label htmlFor="message" className="sr-only">
              Frage an die Persona
            </label>
            <textarea
              id="message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Frage an ${persona.name} stellen...`}
              rows={4}
            />
            <div className="composer-footer">
              <p>
                Keine ERD-Lösungen erfragen, sondern fachliche Informationen, Prozesse und
                Regeln.
              </p>
              <button type="submit" disabled={isLoading || draft.trim().length === 0}>
                {isLoading ? "Senden..." : "Nachricht senden"}
              </button>
            </div>
          </form>

          {error ? <p className="error-banner">{error}</p> : null}
          {refusals[activePersona] ? (
              <p className="notice-banner">
                  Hinweis: {persona.name} hat diese Frage nur eingeschränkt beantwortet, weil sie
                  direkt auf eine Modellierungslösung abzielte.
              </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
