/** A browser-only enhancement applied after sanitized Markdown reaches the DOM. */
export type MarkdownRenderHook = (context: {
  /** The rendered Markdown container. Only modify descendants of this element. */
  element: HTMLElement
  /** Original Markdown source. */
  source: string
  /** Aborted before content changes or the renderer unmounts. */
  signal: AbortSignal
}) => void | (() => void) | Promise<void | (() => void)>
