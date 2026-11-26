/**
 * Re-triggers the interaction that caused the address bar to blur.
 *
 * When the user clicks a button or focuses another input while the address
 * bar is focused, CodeMirror's blur fires first and the path/method update
 * event runs asynchronously. By the time the update resolves, the click has
 * already been consumed — so we capture the blur target via a selector and
 * replay the original interaction once the update completes.
 *
 * - Buttons get a synthetic click to complete the action the user started.
 * - Text inputs and contenteditable elements regain focus so typing resumes
 *   where the user intended.
 * - Anything else is ignored silently.
 *
 * @param root - Where the selector was captured, so it resolves inside a shadow root too
 */
export const refocusBlurTarget = (selector: string | null, root: Document | ShadowRoot = document): void => {
  if (!selector) {
    return
  }

  const element = root.querySelector(selector)

  if (element instanceof HTMLButtonElement) {
    element.click()
    return
  }

  const isEditable =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLElement && element.getAttribute('contenteditable') === 'true')

  if (isEditable) {
    element.focus()
  }
}
