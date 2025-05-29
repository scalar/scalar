/**
 * Breakpoints for useBreakpoints hook
 *
 * Should match the tailwind breakpoints in \@scalar/themes
 */
export const screens = {
  /** Mobile */
  xs: '(min-width: 400px)',
  /** Large Mobile */
  sm: '(min-width: 600px)',
  /** Tablet */
  md: '(min-width: 800px)',
  /** Desktop */
  lg: '(min-width: 1000px)',
  /** Ultrawide and larger */
  xl: '(min-width: 1200px)',
  /** Custom breakpoint for zoomed in screens (should trigger at about 200% zoom) */
  zoomed: '(max-width: 720px) and (max-height: 480px)',
}
