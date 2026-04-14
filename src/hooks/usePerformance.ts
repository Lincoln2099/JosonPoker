import { useMemo } from 'react';

export function usePerformance() {
  const isLowEnd = useMemo(() => {
    try {
      return (navigator.hardwareConcurrency ?? 8) <= 4;
    } catch {
      return false;
    }
  }, []);

  return { isLowEnd };
}
