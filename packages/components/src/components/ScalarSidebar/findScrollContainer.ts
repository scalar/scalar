/**
 * Get the normalized overflow values for both directions from an element.
 *
 * Checks the `overflow` shorthand first, then falls back to `overflowX`/`overflowY` longhands.
 * This ordering is necessary because jsdom does not resolve the shorthand into longhands.
 */
function getOverflowValues(element: HTMLElement) {
  const computed = window.getComputedStyle(element)

  const raw = computed.overflow || element.style.overflow
  if (raw && raw !== 'visible') {
    const [x, y] = raw.split(' ')
    return {
      x: x || '',
      y: y || x || '',
    }
  }

  return {
    x: computed.overflowX || element.style.overflowX,
    y: computed.overflowY || element.style.overflowY,
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
