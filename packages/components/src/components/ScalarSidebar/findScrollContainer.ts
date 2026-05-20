/**
 * Get the normalized overflow values for both directions from an element.
 */
function getOverflowValues(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  const [x, y] = style.overflow.split(' ')

  return {
    x: style.overflowX || x,
    y: style.overflowY || y || x,
  }
}

/**
 * Find the nearest scrollable parent of an element.
 */
export function findScrollContainer(element?: HTMLElement | null, direction: 'x' | 'y' = 'y') {
  if (!element) {
    return document.documentElement
  }

  let parent = element.parentElement
  while (parent) {
    const overflowValues = getOverflowValues(parent)
    const value = overflowValues[direction]

    if (value === 'auto' || value === 'scroll') {
      return parent
    }
    parent = parent.parentElement
  }

  return document.documentElement
}
