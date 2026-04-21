import { useState, useEffect } from 'react';

export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [o, setO] = useState<Orientation>(get);

  useEffect(() => {
    const handle = () => setO(get());
    window.addEventListener('resize', handle);
    window.addEventListener('orientationchange', handle);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('orientationchange', handle);
    };
  }, []);

  return o;
}

function get(): Orientation {
  if (typeof window === 'undefined') return 'portrait';
  return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
}
