/**
 * True when the browser can run a view transition and the user has not asked for reduced motion.
 *
 * A missing `matchMedia` (older test environments) counts as "no preference", so the decision
 * rests on the View Transitions API alone there.
 */
export const supportsViewTransitions = (): boolean => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false
  }

  if (typeof document.startViewTransition !== 'function') {
    return false
  }

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  return !reducedMotion
}

/**
 * Runs `update` inside a view transition when possible, otherwise runs it directly.
 *
 * Resolves once the transition has finished (or been skipped); it never rejects for a skipped
 * transition, because the DOM update has already happened either way.
 */
export const startViewTransition = async (update: () => void | Promise<void>): Promise<void> => {
  if (!supportsViewTransitions()) {
    await update()
    return
  }

  const transition = document.startViewTransition(update)

  // `ready` rejects when the transition is skipped; observing it keeps that off the unhandled-rejection path
  transition.ready.catch(() => undefined)

  try {
    await transition.finished
  } catch {
    // Skipped (another transition in flight, hidden tab, duplicate name): cosmetic only
  }
}
