/**
 * Checks whether a mouse event is a plain left click
 *
 * A plain left click is the only click a single page app should hijack for
 * client side navigation. Modified clicks (meta, ctrl, shift, alt) and
 * non-primary buttons express an intent like opening a new tab or window,
 * so they must be left to the browser's default link handling.
 *
 * This only inspects the button and modifier keys. Whether the default has
 * already been prevented is a separate question, so callers that care about
 * it should check `event.defaultPrevented` themselves — keeping the two apart
 * avoids the order dependency of testing a mutable flag inside a predicate
 * that otherwise reads as a description of the click itself.
 */
export const isPlainLeftClick = (event: MouseEvent): boolean => {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}
