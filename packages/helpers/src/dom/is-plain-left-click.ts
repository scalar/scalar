/**
 * Checks whether a mouse event is a plain left click
 *
 * A plain left click is the only click a single page app should hijack for
 * client side navigation. Modified clicks (meta, ctrl, shift, alt) and
 * non-primary buttons express an intent like opening a new tab or window,
 * so they must be left to the browser's default link handling.
 */
export const isPlainLeftClick = (event: MouseEvent): boolean => {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}
