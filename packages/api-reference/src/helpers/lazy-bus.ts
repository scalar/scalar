import { watchDebounced } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'

import { getSchemaParamsFromId } from './id-routing'

/**
 * List of items that are in the priority queue and will be rendered first (e.g. scroll target).
 */
const priorityQueue = reactive<Set<string>>(new Set())
/** List of items that are pending to be loaded (in viewport overscan). */
const pendingQueue = reactive<Set<string>>(new Set())
/** List of items that are already loaded and stay mounted (no eviction). */
const readyQueue = reactive<Set<string>>(new Set())
/**
 * Flag to indicate if the lazy bus is currently running
 * Blocks ID changes while running
 */
const isRunning = ref(false)

/** How long tryScroll keeps retrying to find the element (ms). */
const SCROLL_RETRY_MS = 3000

/** Allow delayed layout work to finish after the lazy queue has drained. */
const SCROLL_SETTLE_MS = 150

/** Tracks when the initial load is complete. */
export const firstLazyLoadComplete = ref(false)

/**
 * The id of the element we are currently scrolling to (the anchor target).
 *
 * Custom layouts should observe this ref without assigning to it. Use
 * scrollToLazy to navigate so the lazy bus can manage the scroll lifecycle.
 *
 * Schema properties live inside collapsible disclosures that are not part of the
 * navigation tree, so the lazy bus cannot expand them the way it expands sidebar
 * parents. Instead we publish the active target here and let each collapsible
 * schema disclosure open itself when its breadcrumb is on the path to the target.
 * This is what makes deep links to hidden (collapsed) schema properties work.
 */
export const scrollTargetId = ref<string>('')

/**
 * Whether the live scroll target is `path` itself or something inside it.
 *
 * Shared rather than re-spelled per surface, because every caller has to agree
 * on the same rule: a literal `.` separates segments, and the prefix must end
 * on a segment boundary or `user` would claim a deep link to `username`.
 * Returns false for an empty path, so a node with no breadcrumb never matches.
 */
export const isOnScrollTargetPath = (path: string | undefined): boolean => {
  const target = scrollTargetId.value

  if (!path || !target) {
    return false
  }

  return target === path || target.startsWith(`${path}.`)
}

/**
 * Clears the scroll target once we are done with it, so a stale target cannot
 * re-open a disclosure the user later collapsed (or that remounts). Guarded by
 * the id so a newer navigation that started during the scroll retry is kept.
 */
const clearScrollTarget = (id: string): void => {
  if (scrollTargetId.value === id) {
    scrollTargetId.value = ''
  }
}

/** List of unique identifiers that are blocking intersection */
const intersectionBlockers = reactive<Set<string>>(new Set())

const onRenderComplete = new Set<() => void>()

/**
 * Cancels the navigation that currently holds the page on its target.
 * Only one navigation can own the scroll position, so a newer one ends the older freeze.
 */
let cancelActiveScroll: (() => void) | undefined

/** Cached content heights so placeholders can match when not rendered. */
const lazyPlaceholderHeights = reactive<Map<string, number>>(new Map())

export const getLazyPlaceholderHeight = (id: string): number | undefined => lazyPlaceholderHeights.get(id)

export const setLazyPlaceholderHeight = (id: string, height: number): void => {
  if (!Number.isFinite(height) || height <= 0) {
    return
  }
  lazyPlaceholderHeights.set(id, Math.round(height))
}

/** Adds a one time callback to be executed when the lazy bus has finished loading */
const addLazyCompleteCallback = (callback: (() => void) | undefined) => {
  if (callback) {
    onRenderComplete.add(callback)
  }
}

type UnblockFn = () => void

/**
 * Blocks intersection until the returned unblock callback is run.
 * Prevents scroll jump while we render new lazy content.
 */
export const blockIntersection = (): UnblockFn => {
  const blockId = nanoid()
  intersectionBlockers.add(blockId)

  /** Unblock uses a small delay to ensure the scroll is complete before enabling intersection */
  return () => setTimeout(() => intersectionBlockers.delete(blockId), 100)
}

/** If there are any pending blocking operations we disable intersection */
export const intersectionEnabled = computed(() => intersectionBlockers.size === 0)

/**
 * Processes the full queue: priority first, then pending. Blocks intersection while
 * rendering so the viewport does not jump. No eviction — items stay in readyQueue.
 */
const runLazyBus = () => {
  // We always render the lazy bus when the window is undefined (see useLazyBus)
  if (typeof window === 'undefined') {
    return
  }

  if (isRunning.value) {
    return
  }

  isRunning.value = true

  /**
   * Sets all the pending elements into the ready queue
   * After waiting for Vue to update the DOM we execute the callbacks and unblock intersection
   */
  const processQueue = async () => {
    const priorityIds = [...priorityQueue]
    const pendingIds = [...pendingQueue]

    if (priorityIds.length === 0 && pendingIds.length === 0) {
      onRenderComplete.forEach((fn) => fn())
      onRenderComplete.clear()
      isRunning.value = false
      firstLazyLoadComplete.value = true
      return
    }

    for (const id of priorityIds) {
      readyQueue.add(id)
      priorityQueue.delete(id)
    }
    for (const id of pendingIds) {
      readyQueue.add(id)
      pendingQueue.delete(id)
    }

    await nextTick()

    onRenderComplete.forEach((fn) => fn())
    onRenderComplete.clear()
    isRunning.value = false
    firstLazyLoadComplete.value = true
  }

  if (window.requestIdleCallback) {
    window.requestIdleCallback(processQueue, { timeout: 1500 })
  } else {
    void nextTick(processQueue)
  }
}

/**
 * Run the lazy bus when the queue changes and is not currently running
 * Debounce so that multiple changes to the queue are batched together
 *
 * We must run when the priority queue changes because we rely on finish callbacks
 * anytime we request potentially lazy elements. If we don't run when the priority queue changes
 * we may not have a finish callback even though the element is set to load.
 */
watchDebounced(
  [() => pendingQueue.size, () => priorityQueue.size, () => isRunning.value],
  () => {
    if ((pendingQueue.size > 0 || priorityQueue.size > 0) && !isRunning.value) {
      runLazyBus()
    }
  },
  { debounce: 300, maxWait: 1500 },
)

/**
 * We only make elements pending if they are not already in the priority or ready queue
 */
const addToPendingQueue = (id: string | undefined) => {
  if (id && !readyQueue.has(id) && !priorityQueue.has(id)) {
    pendingQueue.add(id)
  }
}

/**
 * Add elements to the priority queue for immediate rendering.
 * We allow adding items already in readyQueue so that callbacks are still triggered,
 * but processQueue will skip actual re-rendering for items already ready.
 */
export const addToPriorityQueue = (id: string | undefined) => {
  if (id && !priorityQueue.has(id)) {
    priorityQueue.add(id)
  }
}

/**
 * Request an item to be rendered (e.g. when it re-enters the overscan zone).
 */
export const requestLazyRender = (id: string | undefined, priority = false): void => {
  if (!id || readyQueue.has(id)) {
    return
  }
  if (priority) {
    addToPriorityQueue(id)
  } else {
    addToPendingQueue(id)
  }
  if (!isRunning.value) {
    runLazyBus()
  }
}

/**
 * Schedules a single run of the lazy bus so that documents with no Lazy components
 * (e.g. no operations, tags, or models) still get firstLazyLoadComplete set and the
 * full-viewport placeholder can be hidden. Call from content root on mount.
 */
export const scheduleInitialLoadComplete = (): void => {
  if (typeof window === 'undefined') {
    return
  }
  const delay = 400
  window.setTimeout(() => runLazyBus(), delay)
}

/** When an element is unmounted we remove it from all queues */
const resetLazyElement = (id: string) => {
  priorityQueue.delete(id)
  pendingQueue.delete(id)
  readyQueue.delete(id)
  lazyPlaceholderHeights.delete(id)
}

// ---------------------------------------------------------------------------

/**
 * Tracks the lazy loading state of an element.
 * Use isReady (or expanded) to decide whether to render the slot or show a placeholder.
 * The element is only added to the queue when it enters the viewport overscan (see Lazy.vue).
 */
export function useLazyBus(id: string) {
  onBeforeUnmount(() => {
    resetLazyElement(id)
  })

  return {
    isReady: computed(() => typeof window === 'undefined' || priorityQueue.has(id) || readyQueue.has(id)),
  }
}

/**
 * Scroll to a possibly lazy-loaded element. Expands parents and adds target (and
 * parents) to the priority queue, then scrolls after Vue has flushed.
 *
 * The id is used exactly as given: legacy anchors (`…responses.headers.headers.X`)
 * are deliberately never rewritten, because a rewrite can corrupt a valid anchor,
 * and an unresolvable id already falls back to scrolling its operation instead
 * (see tryScroll's fallbackId).
 */
export const scrollToLazy = (
  id: string,
  setExpanded: (id: string, value: boolean) => void,
  getEntryById: (id: string) => { id: string; parent?: { id: string }; children?: { id: string }[] } | undefined,
) => {
  const item = getEntryById(id)

  // Even a rendered destination can move while sections above it finish rendering.
  cancelActiveScroll?.()
  const stopTime = Date.now() + SCROLL_RETRY_MS
  const hold = freeze(id, blockIntersection())
  addLazyCompleteCallback(hold.renderComplete)
  const { rawId } = resolveNavigationId(id, getEntryById)

  // Publish the target so collapsible schema disclosures on the path can open
  // themselves. Schema properties are not in the navigation tree, so this is the
  // only way the scroll target inside a collapsed schema becomes reachable.
  scrollTargetId.value = id

  addToPriorityQueue(id)
  addToPriorityQueue(rawId)

  // When there are children we ensure the first 2 are loaded
  if (item?.children) {
    item.children.slice(0, 2).forEach((child) => addToPriorityQueue(child.id))
  }

  // When there are sibling items we attempt to load the next 2 to better fill the viewport
  if (item?.parent) {
    const parent = getEntryById(item.parent.id)
    const elementIdx = parent?.children?.findIndex((child) => child.id === id)
    if (elementIdx !== undefined && elementIdx >= 0) {
      parent?.children?.slice(elementIdx, elementIdx + 2).forEach((child) => addToPriorityQueue(child.id))
    }
  }

  setExpanded(rawId, true)
  /**
   * Recursively expand the parents and set them as a loading priority
   * This ensures all parents will be immediately loaded and open
   */
  const addParents = (currentId: string) => {
    const parent = getEntryById(currentId)?.parent
    if (parent) {
      addToPriorityQueue(parent.id)
      setExpanded(parent.id, true)
      addParents(parent.id)
    }
  }
  /** Must use the rawId as schema params are not in the navigation tree */
  addParents(rawId)

  void nextTick(() => {
    tryScroll(id, stopTime, hold, rawId)
  })
}

/**
 * Find the navigation entry a schema-property anchor belongs to.
 *
 * `getSchemaParamsFromId` splits on operation markers (`.body.`, `.responses.`),
 * so it lands on the operation for a plain property anchor. Three shapes need
 * more than that split, and all three are handled by trimming dot segments from
 * the right until the navigation tree recognises one:
 *
 * - model and AsyncAPI message anchors (`…/models/Planet.name`) carry no marker
 *   at all, so the split returns the whole id
 * - a callback anchor continues past the marker
 *   (`…/post.callbacks.<name>.<url>.<method>.responses.200.id`), so the split
 *   stops at a segment that is not a navigation entry
 * - a callback url expression can hold a marker of its own
 *   (`{$request.query.q}`), so the split can stop mid-expression
 *
 * Trying the full id first keeps a model whose own name contains a dot
 * resolving, and the untrimmed `rawId` stays the fallback when nothing matches.
 */
const resolveNavigationId = (id: string, getEntryById: (id: string) => unknown): { rawId: string } => {
  const { rawId } = getSchemaParamsFromId(id)

  if (getEntryById(rawId)) {
    return { rawId }
  }

  let candidate = rawId

  while (true) {
    const lastDot = candidate.lastIndexOf('.')

    if (lastDot === -1) {
      return { rawId }
    }

    candidate = candidate.slice(0, lastDot)

    if (getEntryById(candidate)) {
      return { rawId: candidate }
    }
  }
}

/**
 * Measures registered headers covering the target at its scrollport's top.
 * Headers opt in with `data-scalar-scroll-header`; unrelated fixed elements are never measured.
 * Horizontal overlap excludes sidebars; sorting also handles stacked navigation bars.
 */
export const getStickyHeaderOffset = (element: HTMLElement, scrollportTop = 0): number => {
  const target = element.getBoundingClientRect()
  const targetX = target.left + target.width / 2
  const headers = Array.from(element.ownerDocument.querySelectorAll<HTMLElement>('[data-scalar-scroll-header]'))
    .flatMap((candidate) => {
      if (candidate === element || candidate.contains(element) || element.contains(candidate)) {
        return []
      }
      // Ignore registered headers outside this target's horizontal scroll region.
      const rect = candidate.getBoundingClientRect()
      if (rect.height <= 0 || rect.bottom <= scrollportTop || rect.left > targetX || rect.right <= targetX) {
        return []
      }
      const style = window.getComputedStyle(candidate)
      return (style.position === 'sticky' || style.position === 'fixed') && style.visibility !== 'hidden' ? [rect] : []
    })
    .sort((a, b) => a.top - b.top)

  if (headers.length === 0) {
    return 0
  }

  // The resolved margin already reserves space for an embedding site's custom
  // header, even when that header is not registered with Scalar.
  const margin = Number.parseFloat(window.getComputedStyle(element).scrollMarginTop) || 0
  let bottom = scrollportTop + Math.max(0, margin)
  for (const header of headers) {
    if (header.top > bottom + 1) {
      break
    }
    bottom = Math.max(bottom, header.bottom)
  }
  return bottom - scrollportTop
}

/** Finds potential scrollports before lazy content makes them overflow. */
const getScrollContainers = (element: HTMLElement): HTMLElement[] => {
  const containers: HTMLElement[] = []
  const root = element.ownerDocument.scrollingElement ?? element.ownerDocument.documentElement
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent !== root && /(auto|scroll|hidden)/.test(window.getComputedStyle(parent).overflowY)) {
      containers.push(parent)
    }
  }
  if (root instanceof HTMLElement) {
    containers.push(root)
  }
  return containers
}

/** Scrolls nested containers natively before compensating for overlapping headers. */
export const scrollToElement = (element: HTMLElement): void => scrollInContainers(element, getScrollContainers(element))

const scrollInContainers = (element: HTMLElement, containers: HTMLElement[]): void => {
  element.scrollIntoView({ block: 'start', behavior: 'instant' })

  // Measure after scrolling, when sticky elements have reached their pinned positions.
  const container = containers.find(
    (parent) => parent !== element.ownerDocument.scrollingElement && parent.scrollHeight > parent.clientHeight,
  )
  const scrollportTop = container ? Math.max(0, container.getBoundingClientRect().top + container.clientTop) : 0
  const offset = getStickyHeaderOffset(element, scrollportTop)
  const margin = Number.parseFloat(window.getComputedStyle(element).scrollMarginTop) || 0
  if (offset <= margin) {
    return
  }

  // Native scrolling applies the margin to the actual scrolling ancestors and preserves
  // existing CSS offsets. Restore the inline declaration so host styling stays in control.
  const previous = element.style.getPropertyValue('scroll-margin-top')
  const priority = element.style.getPropertyPriority('scroll-margin-top')
  element.style.setProperty('scroll-margin-top', `${offset}px`, 'important')
  element.scrollIntoView({ block: 'start', behavior: 'instant' })
  if (previous) {
    element.style.setProperty('scroll-margin-top', previous, priority)
  } else {
    element.style.removeProperty('scroll-margin-top')
  }
}

/**
 * Tiny wrapper around the scrollIntoView API
 * Retries up to the stopTime in case the element is not yet rendered
 *
 * @param id - The id of the element to scroll to
 * @param stopTime - The time to stop retrying in unix milliseconds
 */
const tryScroll = (id: string, stopTime: number, hold: ReturnType<typeof freeze>, fallbackId?: string): void => {
  if (!hold.isActive()) {
    return
  }
  const element = document.getElementById(id)
  if (element) {
    hold.scroll(element)
    if (element instanceof HTMLElement && scrollTargetId.value === id) {
      element.focus({ preventScroll: true })
    }
    clearScrollTarget(id)
  } else if (Date.now() < stopTime) {
    requestAnimationFrame(() => tryScroll(id, stopTime, hold, fallbackId))
  } else {
    if (fallbackId && fallbackId !== id && scrollTargetId.value === id) {
      const fallback = document.getElementById(fallbackId)
      if (fallback) {
        scrollToElement(fallback)
      }
    }
    clearScrollTarget(id)
    hold.cancel()
  }
}

const freeze = (
  id: string,
  unblock: UnblockFn,
): {
  renderComplete: () => void
  cancel: () => void
  isActive: () => boolean
  scroll: (element: HTMLElement) => void
} => {
  let stopped = false
  let rendered = false
  let lastLayoutChange = Date.now()
  let previousTop: number | undefined
  let frame = 0
  let heldElement: HTMLElement | undefined
  let heldParent: HTMLElement | null | undefined
  let containers = [document.scrollingElement ?? document.documentElement].filter(
    (element): element is HTMLElement => element instanceof HTMLElement,
  )
  let expectedScrollTops = containers.map((element) => element.scrollTop)

  const updateContainers = (element: HTMLElement): void => {
    if (heldElement !== element || heldParent !== element.parentElement) {
      heldElement = element
      heldParent = element.parentElement
      containers = getScrollContainers(element)
      expectedScrollTops = containers.map((container) => container.scrollTop)
    }
  }

  const getLayoutTop = (element: HTMLElement): number =>
    containers.reduce((top, container) => top + container.scrollTop, element.getBoundingClientRect().top)

  const scroll = (element: HTMLElement): void => {
    updateContainers(element)
    scrollInContainers(element, containers)
    expectedScrollTops = containers.map((container) => container.scrollTop)
  }

  const renderComplete = (): void => {
    rendered = true
    lastLayoutChange = Date.now()
  }

  const cancel = (): void => {
    if (stopped) {
      return
    }
    stopped = true
    cancelAnimationFrame(frame)
    clearTimeout(timeout)
    onRenderComplete.delete(renderComplete)
    for (const event of ['wheel', 'touchstart', 'pointerdown']) {
      window.removeEventListener(event, cancel, true)
    }
    window.removeEventListener('keydown', onKeydown, true)
    window.removeEventListener('scroll', onScroll, true)
    if (cancelActiveScroll === cancel) {
      cancelActiveScroll = undefined
    }
    clearScrollTarget(id)
    unblock()
  }

  const onKeydown = (event: KeyboardEvent): void => {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)
    ) {
      cancel()
    }
  }

  const onScroll = (event: Event): void => {
    if (
      event.target !== document &&
      event.target !== window &&
      !containers.some((container) => container === event.target)
    ) {
      return
    }
    if (containers.every((container, index) => container.scrollTop === expectedScrollTops[index])) {
      return
    }
    const element = document.getElementById(id)
    if (element) {
      // Replacing a lazy placeholder or native anchoring during a layout change
      // must not be mistaken for a scrollbar drag, which has no pointer event.
      if (element !== heldElement || previousTop === undefined || Math.abs(getLayoutTop(element) - previousTop) > 0.5) {
        return
      }
    }
    cancel()
  }

  cancelActiveScroll = cancel
  // A hidden tab or continuously changing content must not hold navigation indefinitely.
  const timeout = setTimeout(cancel, SCROLL_RETRY_MS + SCROLL_SETTLE_MS)
  for (const event of ['wheel', 'touchstart', 'pointerdown']) {
    window.addEventListener(event, cancel, { capture: true, passive: true })
  }
  window.addEventListener('keydown', onKeydown, true)
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })

  const runFrame = (): void => {
    if (stopped) {
      return
    }
    const element = document.getElementById(id)
    if (element) {
      updateContainers(element)
      // Include every scrollport so browser anchoring does not hide layout changes,
      // including when Scalar is embedded in a nested scrolling container.
      const top = getLayoutTop(element)
      if (previousTop === undefined || Math.abs(top - previousTop) > 0.5) {
        lastLayoutChange = Date.now()
      }
      previousTop = top
      scroll(element)
    }
    if (
      element &&
      rendered &&
      !isRunning.value &&
      pendingQueue.size === 0 &&
      priorityQueue.size === 0 &&
      Date.now() - lastLayoutChange >= SCROLL_SETTLE_MS
    ) {
      cancel()
      return
    }
    frame = requestAnimationFrame(runFrame)
  }

  runFrame()

  return { renderComplete, cancel, isActive: () => !stopped, scroll }
}
