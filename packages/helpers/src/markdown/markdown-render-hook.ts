/**
 * A browser-only enhancement applied after sanitized Markdown reaches the DOM.
 * Hooks run independently; asynchronous hooks do not block later hooks.
 * Return a cleanup callback to release resources when this rendering is invalidated.
 * If it resolves after cancellation, the callback is invoked immediately.
 * Check signal.aborted before changing the DOM after asynchronous work.
 * Any inserted HTML needs its own sanitization; it does not pass through Markdown sanitization.
 */
export type MarkdownRenderHook = (context: {
  /** The rendered Markdown container. Only modify descendants of this element. */
  element: HTMLElement
  /** Original Markdown source. */
  source: string
  /** Aborted when this rendering is invalidated or unmounted, before its cleanup callbacks run. */
  signal: AbortSignal
}) => void | (() => void) | Promise<void | (() => void)>
