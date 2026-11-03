import { useEffect, useState } from 'react';

import type { LearningSnapshot } from './repository';
import { LearningRepository } from './repository';

export function useLearningSnapshot(repository: LearningRepository, refreshKey = 0) {
  const [snapshot, setSnapshot] = useState<LearningSnapshot>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let active = true;
    repository.snapshot().then(
      (value) => active && setSnapshot(value),
      (reason: unknown) => active && setError(reason instanceof Error ? reason : new Error('Unable to load progress.')),
    );
    return () => {
      active = false;
    };
  }, [repository, refreshKey]);

  return { snapshot, error, loading: !snapshot && !error };
}
