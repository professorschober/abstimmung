import type { Results } from "../../types";

export function ResultsView({ results }: { results: Results }) {
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
