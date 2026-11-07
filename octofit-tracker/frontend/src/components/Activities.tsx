import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type?: string;
  minutes?: number;
  points?: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (!cancelled) {
          setActivities(response.activities ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load activities.');
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
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <p role="status">Loading activities...</p>
      </CapabilityCard>
    );
  }

  if (error) {
    return (
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <p role="alert">{error}</p>
      </CapabilityCard>
    );
  }

  if (activities.length === 0) {
    return (
      <CapabilityCard title="Activities" description="Track student activity minutes and points.">
        <p>No activities available.</p>
      </CapabilityCard>
    );
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${activity.occurredAt ?? index}`} className="list-group-item">
            <strong>{activity.type ?? 'Activity'}</strong> · {activity.minutes ?? 0} min · {activity.points ?? 0} pts
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
