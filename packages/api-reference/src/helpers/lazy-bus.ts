import { nanoid } from 'nanoid'
import {
  type ComputedRef,
  type InjectionKey,
  type Ref,
  computed,
  effectScope,
  hasInjectionContext,
  inject,
  nextTick,
  onBeforeUnmount,
  onScopeDispose,
  provide,
  reactive,
  ref,
  watch,
} from 'vue'

import { getSchemaParamsFromId } from './id-routing'

type NavigationEntry = { id: string; parent?: { id: string }; children?: { id: string }[] }
type LazyBus = {
  firstLazyLoadComplete: Ref<boolean>
  scrollTargetId: Ref<string>
  intersectionEnabled: ComputedRef<boolean>
  isOnScrollTargetPath: (path: string | undefined) => boolean
  getLazyPlaceholderHeight: (id: string) => number | undefined
  setLazyPlaceholderHeight: (id: string, height: number) => void
  blockIntersection: () => () => void
  addToPriorityQueue: (id: string | undefined) => void
  requestLazyRender: (id: string | undefined, priority?: boolean) => void
  scheduleInitialLoadComplete: () => void
  useLazyBus: (id: string) => { isReady: ComputedRef<boolean> }
  scrollToLazy: (
    id: string,
    setExpanded: (id: string, value: boolean) => void,
    getEntryById: (id: string) => NavigationEntry | undefined,
    root?: Document | ShadowRoot,
  ) => void
  dispose: () => void
}

/** Own rendering queues and scheduled work independently from other references. */
const createLazyBus = (): LazyBus => {
  const scope = effectScope(true)
  let disposed = false
  let idleCallback: number | undefined
  const timeouts = new Set<ReturnType<typeof setTimeout>>()
  const frames = new Set<number>()
  const scheduleTimeout = (callback: () => void, delay: number): ReturnType<typeof setTimeout> | undefined => {
    if (disposed) return undefined
    const timer = setTimeout(() => {
      timeouts.delete(timer)
      if (!disposed) callback()
    }, delay)
    timeouts.add(timer)
    return timer
  }
  const scheduleFrame = (callback: () => void): void => {
    if (disposed) return
    const frame = requestAnimationFrame(() => {
      frames.delete(frame)
      if (!disposed) callback()
    })
    frames.add(frame)
  }
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

  /** Tracks when the initial load is complete. */
  const firstLazyLoadComplete = ref(false)

  /**
   * The id of the element we are currently scrolling to (the anchor target).
   *
   * Schema properties live inside collapsible disclosures that are not part of the
   * navigation tree, so the lazy bus cannot expand them the way it expands sidebar
   * parents. Instead we publish the active target here and let each collapsible
   * schema disclosure open itself when its breadcrumb is on the path to the target.
   * This is what makes deep links to hidden (collapsed) schema properties work.
   */
  const scrollTargetId = ref<string>('')

  /**
   * Whether the live scroll target is `path` itself or something inside it.
   *
   * Shared rather than re-spelled per surface, because every caller has to agree
   * on the same rule: a literal `.` separates segments, and the prefix must end
   * on a segment boundary or `user` would claim a deep link to `username`.
   * Returns false for an empty path, so a node with no breadcrumb never matches.
   */
  const isOnScrollTargetPath = (path: string | undefined): boolean => {
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

  /** Cached content heights so placeholders can match when not rendered. */
  const lazyPlaceholderHeights = reactive<Map<string, number>>(new Map())

  const getLazyPlaceholderHeight = (id: string): number | undefined => lazyPlaceholderHeights.get(id)

  const setLazyPlaceholderHeight = (id: string, height: number): void => {
    if (!Number.isFinite(height) || height <= 0) {
      return
    }
    lazyPlaceholderHeights.set(id, Math.round(height))
  }

  /** Adds a one time callback to be executed when the lazy bus has finished loading */
  const addLazyCompleteCallback = (callback: (() => void) | undefined): void => {
    if (callback) {
      onRenderComplete.add(callback)
    }
  }

  type UnblockFn = () => void

  /**
   * Blocks intersection until the returned unblock callback is run.
   * Prevents scroll jump while we render new lazy content.
   */
  const blockIntersection = (): UnblockFn => {
    const blockId = nanoid()
    intersectionBlockers.add(blockId)

    /** Unblock uses a small delay to ensure the scroll is complete before enabling intersection */
    return () => {
      scheduleTimeout(() => intersectionBlockers.delete(blockId), 100)
    }
  }

  /** If there are any pending blocking operations we disable intersection */
  const intersectionEnabled = computed(() => intersectionBlockers.size === 0)

  /**
   * Processes the full queue: priority first, then pending. Blocks intersection while
   * rendering so the viewport does not jump. No eviction — items stay in readyQueue.
   */
  const runLazyBus = (): void => {
    // We always render the lazy bus when the window is undefined (see useLazyBus)
    if (typeof window === 'undefined') {
      return
    }

    if (disposed || isRunning.value) {
      return
    }

    isRunning.value = true

    /**
     * Sets all the pending elements into the ready queue
     * After waiting for Vue to update the DOM we execute the callbacks and unblock intersection
     */
    const processQueue = async (): Promise<void> => {
      idleCallback = undefined
      if (disposed) return
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
      if (disposed) return

      onRenderComplete.forEach((fn) => fn())
      onRenderComplete.clear()
      isRunning.value = false
      firstLazyLoadComplete.value = true
    }

    if (window.requestIdleCallback) {
      idleCallback = window.requestIdleCallback(
        () => {
          void processQueue()
        },
        { timeout: 1500 },
      )
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
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let maxWaitTimer: ReturnType<typeof setTimeout> | undefined
  const flushQueue = (): void => {
    clearTimeout(debounceTimer)
    clearTimeout(maxWaitTimer)
    if (debounceTimer !== undefined) timeouts.delete(debounceTimer)
    if (maxWaitTimer !== undefined) timeouts.delete(maxWaitTimer)
    debounceTimer = maxWaitTimer = undefined
    if (!disposed && (pendingQueue.size > 0 || priorityQueue.size > 0) && !isRunning.value) {
      runLazyBus()
    }
  }
  scope.run(() =>
    watch([() => pendingQueue.size, () => priorityQueue.size, () => isRunning.value], () => {
      if (disposed || isRunning.value || (!pendingQueue.size && !priorityQueue.size)) return
      clearTimeout(debounceTimer)
      if (debounceTimer !== undefined) timeouts.delete(debounceTimer)
      debounceTimer = scheduleTimeout(flushQueue, 300)
      maxWaitTimer ??= scheduleTimeout(flushQueue, 1500)
    }),
  )

  /**
   * We only make elements pending if they are not already in the priority or ready queue
   */
  const addToPendingQueue = (id: string | undefined): void => {
    if (id && !readyQueue.has(id) && !priorityQueue.has(id)) {
      pendingQueue.add(id)
    }
  }

  /**
   * Add elements to the priority queue for immediate rendering.
   * We allow adding items already in readyQueue so that callbacks are still triggered,
   * but processQueue will skip actual re-rendering for items already ready.
   */
  const addToPriorityQueue = (id: string | undefined): void => {
    if (id && !priorityQueue.has(id)) {
      priorityQueue.add(id)
    }
  }

  /**
   * Request an item to be rendered (e.g. when it re-enters the overscan zone).
   */
  const requestLazyRender = (id: string | undefined, priority = false): void => {
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
  const scheduleInitialLoadComplete = (): void => {
    if (typeof window === 'undefined') {
      return
    }
    const delay = 400
    scheduleTimeout(() => runLazyBus(), delay)
  }

  /** When an element is unmounted we remove it from all queues */
  const resetLazyElement = (id: string): void => {
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
  const useLazyBus = (id: string): { isReady: ComputedRef<boolean> } => {
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
  const scrollToLazy = (
    id: string,
    setExpanded: (id: string, value: boolean) => void,
    getEntryById: (id: string) => { id: string; parent?: { id: string }; children?: { id: string }[] } | undefined,
    root: Document | ShadowRoot = document,
  ): void => {
    const item = getEntryById(id)

    /**
     * If the element is lazy we must freeze the element so that it does not move until after the next lazy bus run
     * If the element never loads then the scroll onFailure callback will be run to unfreeze the element
     *
     * If the readyQueue does not have the item we must freeze it while it renders
     * If the item has lazy children we must freeze the item while the children are (potentially) loaded
     */
    const isLazy = !readyQueue.has(id) || item?.children?.some((child) => !readyQueue.has(child.id))

    const unfreeze = isLazy ? freeze(id, root) : undefined
    addLazyCompleteCallback(unfreeze)

    // Disable intersection while we scroll to the element
    const unblock = blockIntersection()
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
    const addParents = (currentId: string): void => {
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
      tryScroll(id, Date.now() + SCROLL_RETRY_MS, unblock, root, unfreeze, rawId)
    })
  }

  /**
   * Tiny wrapper around the scrollIntoView API
   * Retries up to the stopTime in case the element is not yet rendered
   *
   * @param id - The id of the element to scroll to
   * @param stopTime - The time to stop retrying in unix milliseconds
   */
  const tryScroll = (
    id: string,
    stopTime: number,
    onComplete: UnblockFn,
    root: Document | ShadowRoot,
    onFailure?: () => void,
    fallbackId?: string,
  ): void => {
    if (disposed) return
    const element = root.getElementById(id)
    if (element) {
      scrollToElement(element)
      if (element instanceof HTMLElement && scrollTargetId.value === id) {
        element.focus({ preventScroll: true })
      }
      clearScrollTarget(id)
      onComplete()
    } else if (Date.now() < stopTime) {
      scheduleFrame(() => tryScroll(id, stopTime, onComplete, root, onFailure, fallbackId))
    } else {
      if (fallbackId && fallbackId !== id && scrollTargetId.value === id) {
        const fallback = root.getElementById(fallbackId)
        if (fallback) {
          scrollToElement(fallback)
        }
      }
      clearScrollTarget(id)
      onComplete()
      onFailure?.()
    }
  }

  const freeze = (id: string, root: Document | ShadowRoot): (() => void) => {
    let stop = false

    const runFrame = (): void => {
      if (disposed || stop) return
      const element = root.getElementById(id)
      if (element) {
        scrollToElement(element)
      }
      scheduleFrame(runFrame)
    }

    runFrame()

    return () => {
      stop = true
    }
  }

  const dispose = (): void => {
    disposed = true
    scope.stop()
    for (const timer of timeouts) clearTimeout(timer)
    for (const frame of frames) cancelAnimationFrame(frame)
    if (idleCallback !== undefined) window.cancelIdleCallback?.(idleCallback)
    timeouts.clear()
    frames.clear()
    onRenderComplete.clear()
    priorityQueue.clear()
    pendingQueue.clear()
    readyQueue.clear()
    lazyPlaceholderHeights.clear()
    intersectionBlockers.clear()
    scrollTargetId.value = ''
  }
  return {
    firstLazyLoadComplete,
    scrollTargetId,
    intersectionEnabled,
    isOnScrollTargetPath,
    getLazyPlaceholderHeight,
    setLazyPlaceholderHeight,
    blockIntersection,
    addToPriorityQueue,
    requestLazyRender,
    scheduleInitialLoadComplete,
    useLazyBus,
    scrollToLazy,
    dispose,
  }
}

const defaultBus = createLazyBus()
const lazyBusKey: InjectionKey<LazyBus> = Symbol('scalar-lazy-bus')

/** Provide isolated rendering and navigation state for this embedded reference. */
export const provideLazyBus = (): LazyBus => {
  const bus = createLazyBus()
  provide(lazyBusKey, bus)
  onScopeDispose(bus.dispose)
  return bus
}

/** Capture the owning navigation context during component setup. */
export const useLazyBusContext = (): LazyBus => (hasInjectionContext() ? inject(lazyBusKey, defaultBus) : defaultBus)

// Preserve the existing document-level API for standalone consumers.
export const {
  firstLazyLoadComplete,
  scrollTargetId,
  intersectionEnabled,
  blockIntersection,
  addToPriorityQueue,
  scrollToLazy,
} = defaultBus

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
  const headers = Array.from(
    (element.getRootNode() as Document | ShadowRoot).querySelectorAll<HTMLElement>('[data-scalar-scroll-header]'),
  )
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

/** Scrolls nested containers natively before compensating for overlapping headers. */
export const scrollToElement = (element: HTMLElement): void => {
  element.scrollIntoView({ block: 'start', behavior: 'instant' })

  // Measure after scrolling, when sticky elements have reached their pinned positions.
  let scrollportTop = 0
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = window.getComputedStyle(parent)
    if (/(auto|scroll|hidden)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
      scrollportTop = Math.max(0, parent.getBoundingClientRect().top + parent.clientTop)
      break
    }
  }
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
