import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  mascot?: string;
  members?: Array<string | { _id?: string; name?: string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (!cancelled) {
          setTeams(response.teams ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load teams.');
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
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <p role="status">Loading teams...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <p role="alert">{error}</p>
      </CapabilityCard>
    );
  }

  if (teams.length === 0) {
    return (
      <CapabilityCard title="Teams" description="Manage teams and members.">
        <p>No teams available.</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
            <strong>{team.name ?? 'Unknown team'}</strong>
            <div className="text-muted">Mascot: {team.mascot ?? '—'}</div>
            <div>{(team.members ?? []).length} member(s)</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
