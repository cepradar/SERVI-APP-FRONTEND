/**
 * useBreakpoint — detecta el breakpoint activo según TailwindCSS.
 * Breakpoints: xs < 640, sm >= 640, md >= 768, lg >= 1024, xl >= 1280, 2xl >= 1536
 */
import { useEffect, useState } from 'react';

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

function getBreakpoint(width) {
  if (width >= 1536) return '2xl';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768)  return 'md';
  if (width >= 640)  return 'sm';
  return 'xs';
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => getBreakpoint(window.innerWidth));
  const [width, setWidth]           = useState(() => window.innerWidth);

  useEffect(() => {
    let rafId;
    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const w = window.innerWidth;
        setWidth(w);
        setBreakpoint(getBreakpoint(w));
      });
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const is      = (bp) => breakpoint === bp;
  const gte     = (bp) => width >= BREAKPOINTS[bp];
  const lte     = (bp) => width <= BREAKPOINTS[bp];
  const between = (min, max) => width >= BREAKPOINTS[min] && width < BREAKPOINTS[max];

  return { breakpoint, width, is, gte, lte, between };
}
