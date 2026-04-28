import { createContext, useContext, ReactNode } from 'react';
import { useModels, ModelsData, ModelEntry } from '../hooks/useModels';

interface ModelsContextValue {
  data: ModelsData;
  loading: boolean;
  error: string | null;
  refreshKey: number;
  refetch: () => void;
  addModel: (payload: Omit<ModelEntry, 'builtin' | 'disabled' | 'id'>) => Promise<ModelEntry>;
  deleteModel: (id: number) => Promise<void>;
  toggleModel: (modelId: string) => Promise<{ disabled: boolean }>;
  getEnergy: (modelId: string) => { input: number; output: number } | null;
}

const ModelsContext = createContext<ModelsContextValue | null>(null);

export function ModelsProvider({ children }: { children: ReactNode }) {
  const value = useModels();
  return <ModelsContext.Provider value={value}>{children}</ModelsContext.Provider>;
}

export function useModelsContext() {
  const ctx = useContext(ModelsContext);
  if (!ctx) throw new Error('useModelsContext must be used inside ModelsProvider');
  return ctx;
}
