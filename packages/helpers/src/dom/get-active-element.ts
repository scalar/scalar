/**
 * Gets the focused element within a document or shadow root
 *
 * Inside a shadow root, `document.activeElement` returns the shadow host, not the element that
 * has focus. Pass the root the code renders into (see `useDocumentRoot`) to get the focused
 * element in that root. For the document this is the same as `document.activeElement`.
 *
 * It does not descend into nested shadow roots. When focus is inside a web component within
 * the root, this returns that component's host, the same way `document.activeElement` does.
 *
 * When nothing in the root has focus, a shadow root returns `null` and the document usually returns
 * `document.body`, as `activeElement` does. Without a root (SSR) it returns `null`.
 */
export const getActiveElement = (root: Document | ShadowRoot | null | undefined): Element | null =>
  root?.activeElement ?? null
