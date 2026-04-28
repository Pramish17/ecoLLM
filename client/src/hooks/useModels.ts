import { useState, useEffect, useCallback, useRef } from 'react';

export interface ModelEntry {
  model_id: string;
  display_name: string;
  input_wh_per_1k: number;
  output_wh_per_1k: number;
  builtin: boolean;
  disabled: boolean;
  source_url?: string | null;
  notes?: string | null;
  id?: number;
}

export interface ModelsData {
  builtin: ModelEntry[];
  custom: ModelEntry[];
  all: ModelEntry[];
  /** Active = not disabled, used in dropdowns/comparison */
  active: ModelEntry[];
}

export function useModels() {
  const [data, setData] = useState<ModelsData>({ builtin: [], custom: [], all: [], active: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Increments every time the model list mutates — lets other hooks subscribe
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpKey = useCallback(() => setRefreshKey(k => k + 1), []);

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

  const addModel = useCallback(async (payload: Omit<ModelEntry, 'builtin' | 'disabled' | 'id'>) => {
    const res = await fetch('/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to add model');
    await refetch();
    bumpKey();
    return json as ModelEntry;
  }, [refetch, bumpKey]);

  const deleteModel = useCallback(async (id: number) => {
    const res = await fetch(`/api/models/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to delete model');
    await refetch();
    bumpKey();
  }, [refetch, bumpKey]);

  const toggleModel = useCallback(async (modelId: string) => {
    const res = await fetch(`/api/models/${encodeURIComponent(modelId)}/toggle`, { method: 'PATCH' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Failed to toggle model');
    await refetch();
    bumpKey();
    return json as { disabled: boolean };
  }, [refetch, bumpKey]);

  const getEnergy = useCallback((modelId: string) => {
    const m = data.all.find(m => m.model_id === modelId);
    if (!m) return null;
    return { input: m.input_wh_per_1k, output: m.output_wh_per_1k };
  }, [data]);

  return { data, loading, error, refreshKey, refetch, addModel, deleteModel, toggleModel, getEnergy };
}
