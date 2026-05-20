/**
 * useMobile — shortcuts para los casos de uso más comunes en responsive.
 */
import { useBreakpoint } from './useBreakpoint';

export function useMobile() {
  const { width, gte } = useBreakpoint();

  return {
    isMobile:  width < 768,          // < md
    isTablet:  width >= 768 && width < 1024,  // md..lg
    isDesktop: width >= 1024,         // >= lg
    isSmall:   width < 640,           // < sm (teléfonos pequeños)
    isMd:      gte('md'),
    isLg:      gte('lg'),
    width,
  };
}
