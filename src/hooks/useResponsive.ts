import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    function handleResize() {
      setBp(getBreakpoint());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return bp;
}

function getBreakpoint(): Breakpoint {
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}
