const DEFAULT_SCROLL_OFFSET_TOP = 100

/**
 * Returns the element that should be used for vertical position measurement.
 */
const getMeasurableElement = (element: HTMLElement): HTMLElement => {
  if (window.getComputedStyle(element).display !== 'contents') {
    return element
  }

  /**
   * `display: contents` does not render a layout box, so use the first child with
   * a measurable offset to keep the scroll target aligned with what users see.
   */
  for (const child of element.children) {
    if (child instanceof HTMLElement && child.offsetParent !== null) {
      return child
    }
  }

  return element
}

/**
 * Adds extra offset for heading rows so the selected item stays visible below labels.
 */
const getHeadingOffset = (element: HTMLElement): number => {
  if (element.dataset.sidebarType !== 'heading') {
    return 0
  }

  return element.querySelector<HTMLElement>('.sidebar-heading')?.offsetHeight ?? 0
}

/**
 * Computes an element top position relative to the provided scroll container.
 */
const getTopRelativeToScroller = (element: HTMLElement, scroller: HTMLElement): number => {
  let top = element.offsetTop
  let currentOffsetParent = element.offsetParent as HTMLElement | null

  while (currentOffsetParent && currentOffsetParent !== scroller) {
    top += currentOffsetParent.offsetTop
    currentOffsetParent = currentOffsetParent.offsetParent as HTMLElement | null
  }

  return top
}

/**
 * Scrolls the sidebar container so the requested item appears near the top.
 */
export const scrollSidebarToTop = (id: string, offsetTop: number = DEFAULT_SCROLL_OFFSET_TOP): void => {
  if (typeof window === 'undefined') {
    return
  }

  const element = document.querySelector<HTMLElement>(`[data-sidebar-id="${id}"]`)
  const scroller = element?.closest<HTMLElement>('.custom-scroll, .custom-scrollbar') ?? null
  if (!element || !scroller) {
    return
  }

  const measurableElement = getMeasurableElement(element)
  const itemTop = getTopRelativeToScroller(measurableElement, scroller)
  const itemOffset = getHeadingOffset(element)
  const targetTop = itemTop + itemOffset - offsetTop

  scroller.scrollTo({
    top: targetTop > 0 ? targetTop : 0,
    behavior: 'smooth',
  })
}
