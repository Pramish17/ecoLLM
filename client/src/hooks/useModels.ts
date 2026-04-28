import { useState, useEffect, useCallback } from 'react';

export interface ModelEntry {
  model_id: string;
  display_name: string;
  input_wh_per_1k: number;
  output_wh_per_1k: number;
  builtin: boolean;
  source_url?: string | null;
  notes?: string | null;
  id?: number;
}

export interface ModelsData {
  builtin: ModelEntry[];
  custom: ModelEntry[];
  all: ModelEntry[];
}

export function useModels() {
  const [data, setData] = useState<ModelsData>({ builtin: [], custom: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const addModel = useCallback(async (payload: Omit<ModelEntry, 'builtin' | 'id'>) => {
    const res = await fetch('/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to add model');
    await refetch();
    return json;
  }, [refetch]);

  const deleteModel = useCallback(async (id: number) => {
    const res = await fetch(`/api/models/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to delete model');
    await refetch();
  }, [refetch]);

  // Lookup helper — works for built-in and custom
  const getEnergy = useCallback((modelId: string) => {
    const m = data.all.find(m => m.model_id === modelId);
    if (!m) return null;
    return { input: m.input_wh_per_1k, output: m.output_wh_per_1k };
  }, [data]);

  return { data, loading, error, refetch, addModel, deleteModel, getEnergy };
}
