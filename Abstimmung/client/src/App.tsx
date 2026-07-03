import { useState } from "react";
import { StudentView } from "./views/StudentView";
import { TeacherView } from "./views/TeacherView";
import { getInitialCode } from "./utils/sessionLinks";

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
            Schüler
          </button>
        </nav>
      </header>

      {mode === "teacher" ? <TeacherView /> : <StudentView initialCode={getInitialCode()} />}
    </main>
  );
}
