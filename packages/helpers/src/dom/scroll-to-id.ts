/**
 * Tiny wrapper around the scrollIntoView API
 *
 * Also focuses the element if the focus flag is true
 */
export const scrollToId = async (id: string, focus?: boolean) => {
  const scrollToElement = (element: HTMLElement) => {
    element.scrollIntoView()
    if (focus) {
      element.focus()
    }
  }

  // Try to find the element immediately
  const element = document.getElementById(id)
  if (element) {
    scrollToElement(element)
    return
  }

  /** Try to find the element for up to 1 second
   * allowing it to render for instance in markdown heading usage
   */
  const stopTime = Date.now() + 1000

  const tryScroll = () => {
    const element = document.getElementById(id)
    if (element) {
      scrollToElement(element)
      return
    }

    if (Date.now() < stopTime) {
      requestAnimationFrame(tryScroll)
    }
  }

  // Start the retry process if the element doesn't exist yet
  requestAnimationFrame(tryScroll)
}
