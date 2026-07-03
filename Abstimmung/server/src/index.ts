import cors from "cors";
import express from "express";
import {
  createSession,
  deleteSession,
  getDatabaseInfo,
  getResults,
  getSession,
  joinSession,
  listSessions,
  revealSession,
  submitAnswers,
  toPublicSession
} from "./store.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, database: getDatabaseInfo() });
});

app.get("/api/sessions", (_request, response) => {
  response.json(listSessions().map(toPublicSession));
});

app.post("/api/sessions", (request, response) => {
  const { title, type, questions } = request.body ?? {};

  if (!title || !["quiz", "poll"].includes(type) || !Array.isArray(questions) || questions.length === 0) {
    response.status(400).json({ error: "Invalid session payload" });
    return;
  }

  const invalidQuestion = questions.some(
    (question) =>
      !question?.text ||
      !Array.isArray(question.options) ||
      question.options.filter((option: unknown) => typeof option === "string" && option.trim()).length < 2
  );

  if (invalidQuestion) {
    response.status(400).json({ error: "Each question needs text and at least two options" });
    return;
  }

  const session = createSession({ title, type, questions });
  response.status(201).json(toPublicSession(session));
});

app.get("/api/sessions/:code", (request, response) => {
  const session = getSession(request.params.code);
  if (!session) {
    response.status(404).json({ error: "Session not found" });
    return;
  }
  response.json(toPublicSession(session));
});

app.delete("/api/sessions/:code", (request, response) => {
  const deleted = deleteSession(request.params.code);
  if (!deleted) {
    response.status(404).json({ error: "Session not found" });
    return;
  }
  response.status(204).send();
});

app.post("/api/sessions/:code/join", (request, response) => {
  const session = getSession(request.params.code);
  const name = String(request.body?.name ?? "").trim();

  if (!session) {
    response.status(404).json({ error: "Session not found" });
    return;
  }
  if (!name) {
    response.status(400).json({ error: "Name is required" });
    return;
  }

  response.status(201).json(joinSession(session, name));
});

app.post("/api/sessions/:code/answers", (request, response) => {
  const session = getSession(request.params.code);
  const participantId = String(request.body?.participantId ?? "");
  const answers = request.body?.answers;

  if (!session) {
    response.status(404).json({ error: "Session not found" });
    return;
  }
  if (!participantId || !Array.isArray(answers)) {
    response.status(400).json({ error: "Invalid answer payload" });
    return;
  }

  try {
    submitAnswers(session, participantId, answers);
    response.json({ ok: true, results: getResults(session) });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Invalid answers" });
  }
});

app.post("/api/sessions/:code/reveal", (request, response) => {
  const session = getSession(request.params.code);
  if (!session) {
    response.status(404).json({ error: "Session not found" });
    return;
  }
  revealSession(session);
  response.json(getResults(session));
});

app.get("/api/sessions/:code/results", (request, response) => {
  const session = getSession(request.params.code);
  if (!session) {
    response.status(404).json({ error: "Session not found" });
    return;
  }
  response.json(getResults(session));
});

app.listen(port, () => {
  console.log(`Abstimmung API listening on http://localhost:${port}`);
});
