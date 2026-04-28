import { useState, useEffect } from 'react';

export interface CarbonIntensityData {
  intensity: number;
  forecast: number;
  index: string;
  from: string;
  to: string;
  cached: boolean;
  fallback?: boolean;
}

export function useCarbonIntensity() {
  const [data, setData] = useState<CarbonIntensityData | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/carbon/live');
      setData(await res.json());
    } catch {
      // silently use fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, refetch };
}
