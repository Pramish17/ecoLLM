import { useState, useEffect, useCallback } from 'react';

export interface StatsData {
  monthly: {
    total_calls: number;
    total_carbon_grams: number;
    total_energy_wh: number;
    avg_carbon_per_call: number;
    top_model: string;
  };
  daily_co2: Array<{ day: string; carbon_grams: number; calls: number }>;
  per_model: Array<{
    model: string;
    calls: number;
    total_carbon: number;
    total_energy: number;
    avg_carbon: number;
  }>;
  recent_logs: Array<{
    id: number;
    model: string;
    input_tokens: number;
    output_tokens: number;
    energy_wh: number;
    carbon_grams: number;
    timestamp: string;
    notes: string | null;
  }>;
  optimisation: {
    optimisable_calls: number;
    potential_carbon_saving_grams: number;
    savings_pct: number;
  };
}

export function useStats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await window.fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
