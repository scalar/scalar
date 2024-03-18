/**
 * The ID for the first section of the page.
 */
export const INTRODUCTION_ANCHOR = 'introduction'

/**
 * Scroll section with given id into view.
 */
export const scrollToId = async (id: string) => {
  // If the id is empty, scroll to the top of the page.
  if (id === '') {
    document.getElementById(INTRODUCTION_ANCHOR)?.scrollIntoView()
    return
  }

  // Otherwise, scroll to the element with the given id.
  document.getElementById(id)?.scrollIntoView()
}
