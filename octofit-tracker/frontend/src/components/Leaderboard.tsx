import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!cancelled) {
          setLeaderboard(response.leaderboard ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load leaderboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <p role="status">Loading leaderboard...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <p role="alert">{error}</p>
      </CapabilityCard>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <CapabilityCard title="Leaderboard" description="Compare team point totals.">
        <p>No leaderboard available.</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      <ol className="list-group list-group-numbered">
        {leaderboard.map((entry) => (
          <li key={`${entry.teamName ?? 'team'}-${entry.rank ?? 0}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{entry.teamName ?? 'Unknown team'}</span>
            <span className="badge text-bg-primary rounded-pill">{entry.totalPoints ?? 0}</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
