import { useEffect, useMemo, useState } from "react";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../lib/auth";
import { getOverview, getTimeseries } from "../lib/api";
import type { OverviewResponse, TimeseriesResponse } from "../types";

function isoDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function OverviewPage() {
  const { user } = useAuth();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return isoDay(d);
  });
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const communityId = user?.communityId ?? null;

  async function load() {
    if (!communityId) return;
    setLoading(true);
    setError("");
    try {
      const [ov, ts] = await Promise.all([
        getOverview(communityId, { from: new Date(from).toISOString(), to: new Date(to).toISOString() }),
        getTimeseries(communityId, {
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString(),
          granularity: "daily",
        }),
      ]);
      setOverview(ov);
      setTimeseries(ts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const latest = useMemo(() => timeseries?.series.slice(-7) ?? [], [timeseries]);

  if (!communityId) {
    return <p className="empty">No community assigned to this admin account.</p>;
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="row between">
          <h3>Dashboard Overview</h3>
          <div className="row">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <button className="btn btn-primary" onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading dashboard...</p> : null}

      {overview ? (
        <>
          <div className="stats-grid">
            <StatCard label="Total Members" value={overview.kpis.totalMembers} />
            <StatCard
              label="Active Members"
              value={overview.kpis.activeMembers30d}
              hint={`7d: ${overview.kpis.activeMembers7d}`}
            />
            <StatCard label="Total CO2 Saved" value={`${overview.kpis.totalCo2Saved} kg`} />
            <StatCard label="Total Points" value={overview.kpis.totalPoints} />
            <StatCard label="Missions (Range)" value={overview.kpis.missionsCompleted} />
            <StatCard label="CO2 Saved (Range)" value={`${overview.kpis.co2SavedInRange} kg`} />
            <StatCard label="Events (Range)" value={overview.kpis.eventsInRange} />
            <StatCard label="Event RSVPs (Range)" value={overview.kpis.eventRsvpsInRange} />
            <StatCard label="Quizzes (Range)" value={overview.kpis.quizzesInRange} />
            <StatCard
              label="Quiz Performance"
              value={`${overview.kpis.quizAverageScoreInRange}%`}
              hint={`Attempts: ${overview.kpis.quizAttemptsInRange}`}
            />
          </div>

          <div className="card">
            <h3>Last 7 Buckets Snapshot</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bucket</th>
                    <th>CO2 Saved</th>
                    <th>Missions</th>
                    <th>Active Users</th>
                    <th>Event RSVPs</th>
                    <th>Quiz Attempts</th>
                    <th>Avg Quiz Score</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((row) => (
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
          </div>
        </>
      ) : null}
    </div>
  );
}
