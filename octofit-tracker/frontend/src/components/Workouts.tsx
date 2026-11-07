import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const userEmail = 'mona@example.com';
      try {
        const response = await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
        if (!cancelled) {
          setSuggestions(response.suggestions ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load workout suggestions.');
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
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <p role="status">Loading workout suggestions...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <p role="alert">{error}</p>
      </CapabilityCard>
    );
  }

  if (suggestions.length === 0) {
    return (
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
        <p>No workout suggestions available.</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item">
            <strong>{suggestion.title ?? 'Workout'}</strong>
            <div className="text-muted">Focus: {suggestion.focus ?? 'general'}</div>
            <div>{suggestion.reason ?? 'Supports your routine.'}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
