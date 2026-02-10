const DEFAULT_SCROLL_OFFSET_TOP = 100

/**
 * Scrolls the selected element near the top of the scroller, offset by the given amount
 *
 * @param id - the id of the element to scroll to
 * @param offsetTop - the offset from the top of the scroller to scroll to
 * @returns
 */
export const scrollSidebarToTop = (id: string, offsetTop: number = DEFAULT_SCROLL_OFFSET_TOP) => {
  if (typeof window === 'undefined') {
    return
  }

  /** Grab the element and scroller if needed */
  const element = document.querySelector<HTMLElement>(`[data-sidebar-id="${id}"]`)
  const scroller = element?.closest<HTMLElement>('.custom-scroll, .custom-scrollbar') ?? null
  if (!element || !scroller) {
    return
  }

  let top = element.offsetTop
  let parent = element.parentElement

  /** We walk up the parents to add to the offset to account for nested items */
  while (parent && parent !== scroller) {
    top += parent.offsetTop
    parent = parent.parentElement
  }

  /** Heading items include a label block; account for its height to keep the selected row visible */
  if (element.dataset.sidebarType === 'heading') {
    const headingElement = element.querySelector<HTMLElement>('.sidebar-heading')
    top += headingElement?.offsetHeight ?? 0
  }

  scroller.scrollTo({
    top: Math.max(top - offsetTop, 0),
    behavior: 'smooth',
  })
}
