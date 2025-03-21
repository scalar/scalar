/**
 * Scroll Freezing Utility
 * "Freezes" the scroll position of an element, so that it doesn't move when the rest of the content changes
 *
 * @example
 * const unfreeze = freezeElement(document.querySelector('#your-element'))
 * ... content changes ...
 * unfreeze()
 */
export const freezeElement = (element: HTMLElement) => {
  if (!element) {
    return () => null
  }

  // Get initial position relative to viewport
  const rect = element.getBoundingClientRect()
  const initialViewportTop = rect.top

  // Create mutation observer to watch for DOM changes
  const observer = new MutationObserver(() => {
    const newRect = element.getBoundingClientRect()
    const currentViewportTop = newRect.top

    // If element has moved from its initial viewport position
    if (currentViewportTop !== initialViewportTop) {
      // Calculate how far it moved
      const diff = currentViewportTop - initialViewportTop
      // Adjust scroll to maintain position
      window.scrollBy(0, diff)
    }
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })

  // Return function to stop maintaining position
  return () => observer.disconnect()
}
