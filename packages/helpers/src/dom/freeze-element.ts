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

  let rafId: number | null = null

  // Create mutation observer to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    // Only process if we have mutations that might affect layout
    const shouldProcess = mutations.some(
      (mutation) =>
        mutation.type === 'childList' ||
        (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')),
    )

    if (!shouldProcess) {
      return
    }

    // Cancel any pending animation frame
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }

    // Schedule the scroll adjustment for the next frame
    rafId = requestAnimationFrame(() => {
      element.scrollIntoView()
      rafId = null
    })
  })

  // Start observing with more specific configuration
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
    characterData: false,
  })

  // Return function to stop maintaining position
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    observer.disconnect()
  }
}
