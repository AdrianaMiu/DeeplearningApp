import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { learningDatabase } from '../data/db';
import { useLearningSnapshot } from '../data/hooks';
import { LearningRepository, type LearningSnapshot } from '../data/repository';

interface AppContextValue {
  repository: LearningRepository;
  snapshot?: LearningSnapshot;
  loading: boolean;
  error?: Error;
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);
const defaultRepository = new LearningRepository(learningDatabase);

export function AppProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode;
  repository?: LearningRepository;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const result = useLearningSnapshot(repository, refreshKey);
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);
  const value = useMemo(
    () => ({ repository, refresh, ...result }),
    [repository, refresh, result],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppData must be used inside AppProvider');
  return value;
}
