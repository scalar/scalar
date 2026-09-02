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

/** Tracks when the initial load is complete. */
export const firstLazyLoadComplete = ref(false)

/**
 * The id of the element we are currently scrolling to (the anchor target).
 *
 * Schema properties live inside collapsible disclosures that are not part of the
 * navigation tree, so the lazy bus cannot expand them the way it expands sidebar
 * parents. Instead we publish the active target here and let each collapsible
 * schema disclosure open itself when its breadcrumb is on the path to the target.
 * This is what makes deep links to hidden (collapsed) schema properties work.
 */
export const scrollTargetId = ref<string>('')

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
    // biome-ignore lint/nursery/noFloatingPromises: Expected floating promise
    nextTick(processQueue)
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
 */
export const scrollToLazy = (
  requestedId: string,
  setExpanded: (id: string, value: boolean) => void,
  getEntryById: (id: string) => { id: string; parent?: { id: string }; children?: { id: string }[] } | undefined,
) => {
  // Deliberately no rewriting of legacy anchors (`…responses.headers.headers.X`):
  // a rewrite can corrupt a valid anchor, and an unresolvable id falls back to
  // scrolling its operation instead (see tryScroll's fallbackId).
  const id = requestedId
  const item = getEntryById(id)

  /**
   * If the element is lazy we must freeze the element so that it does not move until after the next lazy bus run
   * If the element never loads then the scroll onFailure callback will be run to unfreeze the element
   *
   * If the readyQueue does not have the item we must freeze it while it renders
   * If the item has lazy children we must freeze the item while the children are (potentially) loaded
   */
  const isLazy = !readyQueue.has(id) || item?.children?.some((child) => !readyQueue.has(child.id))

  const unfreeze = isLazy ? freeze(id) : undefined
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
    tryScroll(id, Date.now() + SCROLL_RETRY_MS, unblock, unfreeze, rawId)
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
  onFailure?: () => void,
  fallbackId?: string,
): void => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ block: 'start' })
    /**
     * Focus the target as well as scrolling to it, so a deep link lands keyboard
     * and screen-reader users on what they followed the link for rather than at
     * the top of the document. `preventScroll` is load-bearing: `freeze`
     * re-scrolls this element every frame while the lazy bus settles, and a
     * focus-driven scroll would fight it. Only the current target is focused,
     * because this loop retries for seconds while lazy content mounts and a
     * superseded navigation must not yank a screen reader back to stale content.
     */
    if (element instanceof HTMLElement && scrollTargetId.value === id) {
      element.focus({ preventScroll: true })
    }
    clearScrollTarget(id)
    onComplete()
  } else if (Date.now() < stopTime) {
    requestAnimationFrame(() => tryScroll(id, stopTime, onComplete, onFailure, fallbackId))
  } else {
    // The exact element never appeared, so land on the section the anchor
    // belongs to rather than leaving the reader with no feedback. This is what
    // keeps a legacy anchor (an old response-header link) reaching its operation.
    if (fallbackId && fallbackId !== id && scrollTargetId.value === id) {
      document.getElementById(fallbackId)?.scrollIntoView({ block: 'start' })
    }

    // If the scroll has expired we enable intersection again
    clearScrollTarget(id)
    onComplete()
    onFailure?.()
  }
}

const freeze = (id: string): (() => void) => {
  let stop = false

  /**
   * Runs until the stop flag is set
   * Executes the final frame after stop changes to true
   */
  const runFrame = (stopAfterFrame: boolean) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ block: 'start' })
    }
    if (!stopAfterFrame) {
      requestAnimationFrame(() => runFrame(stop))
    }
  }

  runFrame(false)

  return () => {
    stop = true
  }
}
