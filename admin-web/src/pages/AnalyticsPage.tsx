import { useEffect, useState } from "react";
import { getQuizAnalytics, getTimeseries, listQuizzes } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { QuizAnalyticsResponse, TimeseriesResponse } from "../types";

export function AnalyticsPage() {
  const { user } = useAuth();
  const communityId = user?.communityId ?? "";
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(null);
  const [quizList, setQuizList] = useState<Array<{ _id: string; title: string }>>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalyticsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!communityId) return;
    setLoading(true);
    setError("");
    try {
      const [ts, quizzes] = await Promise.all([
        getTimeseries(communityId, { granularity: "weekly" }),
        listQuizzes(communityId, { page: 1, limit: 100 }),
      ]);
      setTimeseries(ts);
      const q = quizzes.items.map((i) => ({ _id: i._id, title: i.title }));
      setQuizList(q);
      if (q.length > 0) {
        setSelectedQuizId((prev) => prev || q[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  useEffect(() => {
    async function loadQuizAnalytics() {
      if (!communityId || !selectedQuizId) return;
      try {
        const result = await getQuizAnalytics(communityId, selectedQuizId);
        setQuizAnalytics(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz analytics");
      }
    }
    void loadQuizAnalytics();
  }, [communityId, selectedQuizId]);

  if (!communityId) {
    return <p className="empty">No community assigned to this admin account.</p>;
  }

  return (
    <div className="stack">
      <div className="card">
        <h3>Weekly Performance Trend</h3>
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading analytics...</p> : null}
        {timeseries ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Week</th>
                  <th>CO2 Saved</th>
                  <th>Missions</th>
                  <th>Active Users</th>
                  <th>Event RSVPs</th>
                  <th>Quiz Attempts</th>
                  <th>Avg Quiz Score</th>
                </tr>
              </thead>
              <tbody>
                {timeseries.series.map((row) => (
                  <tr key={row.bucket}>
                    <td>{row.bucket}</td>
                    <td>{row.co2Saved}</td>
                    <td>{row.missionsCompleted}</td>
                    <td>{row.activeUsers}</td>
                    <td>{row.eventRsvps}</td>
                    <td>{row.quizAttempts}</td>
                    <td>{row.avgQuizScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="card">
        <div className="row between">
          <h3>Quiz Performance</h3>
          <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)}>
            {quizList.map((q) => (
              <option key={q._id} value={q._id}>
                {q.title}
              </option>
            ))}
          </select>
        </div>

        {quizAnalytics ? (
          <div className="stack-sm">
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Attempts</p>
                <h3 className="stat-value">{quizAnalytics.summary.attempts}</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Completion Rate</p>
                <h3 className="stat-value">{quizAnalytics.summary.completionRate}%</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Average Score</p>
                <h3 className="stat-value">{quizAnalytics.summary.averageScore}%</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Pass Rate</p>
                <h3 className="stat-value">{quizAnalytics.summary.passRate}%</h3>
              </div>
            </div>

            <div className="row">
              <div className="card compact">
                <h4>Top Questions</h4>
                <ul>
                  {quizAnalytics.topQuestions.map((q) => (
                    <li key={`top-${q.index}`}>
                      Q{q.index + 1}: {q.accuracy}% accuracy
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card compact">
                <h4>Bottom Questions</h4>
                <ul>
                  {quizAnalytics.bottomQuestions.map((q) => (
                    <li key={`bottom-${q.index}`}>
                      Q{q.index + 1}: {q.accuracy}% accuracy
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Score</th>
                    <th>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {quizAnalytics.leaderboard.map((row) => (
                    <tr key={`${row.userId}-${row.completedAt}`}>
                      <td>{row.name}</td>
                      <td>{row.scorePercent}%</td>
                      <td>{new Date(row.completedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="muted">No quiz analytics available yet.</p>
        )}
      </div>
    </div>
  );
}
