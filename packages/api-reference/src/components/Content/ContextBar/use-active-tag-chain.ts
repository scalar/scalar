import { type MaybeRefOrGetter, type Ref, onBeforeUnmount, onMounted, ref, toValue, watch } from 'vue'

import type { Crumb, HeaderTagChain } from './helpers'

/** Slack below the bar so a heading counts as "entered" the moment it tucks under it. */
const HEADER_ENTER_EPSILON = 1

/**
 * Tracks which tag section is currently pinned beneath the sticky context bar and
 * exposes its breadcrumb trail.
 *
 * Unlike the sidebar's center-of-viewport scroll spy, this is top-anchored: the
 * active trail belongs to the deepest header-rendering tag whose heading has
 * scrolled up to or past the bar. That keeps the breadcrumb moving monotonically
 * as the reader descends a nested branch and resets it cleanly when they enter a
 * sibling branch. Before the first heading is pinned (the Introduction) it falls
 * back to the first tag, so the reserved bar shows a label instead of sitting empty.
 */
export const useActiveTagChain = (
  headerTagChains: MaybeRefOrGetter<HeaderTagChain[]>,
  /** The sticky bar element, whose resting bottom edge is the line a heading must pass. */
  barElement: MaybeRefOrGetter<HTMLElement | null | undefined>,
): Ref<Crumb[]> => {
  const activeChain = ref<Crumb[]>([])

  /** The viewport y-coordinate of the bar's resting bottom edge. */
  const triggerLine = (): number => {
    const bar = toValue(barElement)
    if (!bar) {
      return 0
    }

    // The bar sticks at `top: var(--refs-header-height)`, so its resting bottom sits at
    // that offset plus its own height regardless of the current scroll position.
    const stickyTop = Number.parseFloat(getComputedStyle(bar).top) || 0
    return stickyTop + bar.offsetHeight + HEADER_ENTER_EPSILON
  }

  const measure = () => {
    const line = triggerLine()
    const chains = toValue(headerTagChains)

    // Chains are in document order, so the last heading above the line is the
    // deepest section the reader has scrolled into. Headings that are not rendered
    // yet (collapsed or lazy) are simply skipped until they appear.
    let active: Crumb[] = []
    for (const { id, chain } of chains) {
      const element = document.getElementById(id)
      if (element && element.getBoundingClientRect().top <= line) {
        active = chain
      }
    }

    // Above every heading, fall back to the first tag so the bar is never empty.
    activeChain.value = active.length > 0 ? active : (chains[0]?.chain ?? [])
  }

  let frame: number | null = null

  const scheduleMeasure = () => {
    if (frame !== null) {
      return
    }

    if (typeof requestAnimationFrame === 'undefined') {
      measure()
      return
    }

    frame = requestAnimationFrame(() => {
      frame = null
      measure()
    })
  }

  onMounted(() => {
    // Capture so scrolls inside embedded scroll containers bubble to us as well.
    window.addEventListener('scroll', scheduleMeasure, { capture: true, passive: true })
    window.addEventListener('resize', scheduleMeasure, { passive: true })
    scheduleMeasure()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', scheduleMeasure, true)
    window.removeEventListener('resize', scheduleMeasure)
    if (frame !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(frame)
    }
  })

  // Re-measure when the set of header tags changes (document switch, expand/collapse).
  watch(() => toValue(headerTagChains), scheduleMeasure, { flush: 'post' })

  return activeChain
}
