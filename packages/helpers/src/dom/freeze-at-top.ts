/**
 * Freezes an element at the top of the viewport using a mutation observer to check if the element has entered the dom
 * Differs from freezeElement as the element doesn't need to exist yet
 */
export const freezeAtTop = (id: string, target: HTMLElement = document.body) => {
  if (!id) {
    return () => null
  }

  let rafId: number | null = null
  let element = document.getElementById(id)

  // Create mutation observer to watch for DOM changes
  const observer = new MutationObserver(() => {
    element ||= document.getElementById(id)

    if (!element) {
      return
    }

    // Scroll early
    element.scrollIntoView()

    // Cancel any pending animation frame
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }

    // Schedule the scroll adjustment for the next frame
    rafId = requestAnimationFrame(() => {
      element?.scrollIntoView()
      rafId = null
    })
  })

  // Start observing with more specific configuration
  observer.observe(target, {
    childList: true,
    subtree: true,
  })

  // Return function to stop maintaining position
  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    observer.disconnect()
  }
}
