import { watchDebounced } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'

import { getSchemaParamsFromId } from './id-routing'

/**
 * List of items that are in the priority queue and will be immediately rendered
 * Following these items the pending queue will be rendered in a batch
 */
const priorityQueue = reactive<Set<string>>(new Set())
/** List of items that are pending to be loaded */
const pendingQueue = reactive<Set<string>>(new Set())
/** List of items that are already loaded */
const readyQueue = reactive<Set<string>>(new Set())
/**
 * Flag to indicate if the lazy bus is currently running
 * Blocks ID changes while running
 */
const isRunning = ref(false)

/** How long tryScroll keeps retrying to find the element (ms). Must exceed worst-case lazy-bus delay. */
const SCROLL_RETRY_MS = 3000
/** Number of non-priority lazy elements rendered per idle cycle. */
const LAZY_BATCH_SIZE = 20
/** Number of priority lazy elements rendered per idle cycle. */
const PRIORITY_BATCH_SIZE = 6
/** Keep the ready queue bounded so we do not keep all lazy sections mounted forever. */
const MAX_READY_QUEUE_SIZE = 120
/** Keep recently requested priority ids mounted to avoid immediate churn after navigation. */
const RETAINED_PRIORITY_LIMIT = 48

/** Tracks when the initial load is complete.
 * We will have placeholder content to allow the active item to be scrolled to the top while
 * the rest of the content is loaded.
 */
export const firstLazyLoadComplete = ref(false)

/** List of unique identifiers that are blocking intersection */
const intersectionBlockers = reactive<Set<string>>(new Set())

const onRenderComplete = new Set<() => void>()
/** Maintains insertion order for ready ids so we can evict oldest entries first. */
const readyQueueOrder: string[] = []
/** Maintains recency order for priority ids so we can prioritize the latest viewport target. */
const priorityQueueOrder: string[] = []
/** Priority ids retained from eviction for a short rolling window. */
const retainedPriorityIds = reactive<Set<string>>(new Set())
const retainedPriorityOrder: string[] = []
/** Cached heights used by lazy placeholders to stabilize scroll position. */
const lazyPlaceholderHeights = reactive<Map<string, number>>(new Map())

/** Adds a one time callback to be executed when the lazy bus has finished loading */
const addLazyCompleteCallback = (callback: (() => void) | undefined) => {
  if (callback) {
    onRenderComplete.add(callback)
  }
}

export const getLazyPlaceholderHeight = (id: string): number | undefined =>
  lazyPlaceholderHeights.get(id)

export const setLazyPlaceholderHeight = (id: string, height: number): void => {
  if (!Number.isFinite(height) || height <= 0) {
    return
  }

  lazyPlaceholderHeights.set(id, Math.round(height))
}

const touchReadyOrder = (id: string) => {
  const existingIndex = readyQueueOrder.indexOf(id)
  if (existingIndex >= 0) {
    readyQueueOrder.splice(existingIndex, 1)
  }
  readyQueueOrder.push(id)
}

const touchPriorityOrder = (id: string) => {
  const existingIndex = priorityQueueOrder.indexOf(id)
  if (existingIndex >= 0) {
    priorityQueueOrder.splice(existingIndex, 1)
  }
  priorityQueueOrder.push(id)
}

const removePriorityOrder = (id: string) => {
  const existingIndex = priorityQueueOrder.indexOf(id)
  if (existingIndex >= 0) {
    priorityQueueOrder.splice(existingIndex, 1)
  }
}

const addToReadyQueue = (id: string) => {
  if (!readyQueue.has(id)) {
    readyQueue.add(id)
  }

  touchReadyOrder(id)
}

const retainPriorityId = (id: string) => {
  retainedPriorityIds.add(id)

  const existingIndex = retainedPriorityOrder.indexOf(id)
  if (existingIndex >= 0) {
    retainedPriorityOrder.splice(existingIndex, 1)
  }
  retainedPriorityOrder.push(id)

  while (retainedPriorityOrder.length > RETAINED_PRIORITY_LIMIT) {
    const oldestId = retainedPriorityOrder.shift()
    if (oldestId) {
      retainedPriorityIds.delete(oldestId)
    }
  }
}

const evictReadyQueue = () => {
  if (readyQueue.size <= MAX_READY_QUEUE_SIZE) {
    return
  }

  const isInViewport = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    return rect.bottom > 0 && rect.top < window.innerHeight
  }

  const isAboveViewport = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    return rect.bottom <= 0
  }

  const evictReadyEntry = (id: string) => {
    const element = document.getElementById(id)

    if (element && isInViewport(element)) {
      return false
    }

    const shouldCompensateScroll = element ? isAboveViewport(element) : false
    const removedHeight = shouldCompensateScroll ? element?.offsetHeight ?? 0 : 0

    readyQueue.delete(id)
    const readyIndex = readyQueueOrder.indexOf(id)
    if (readyIndex >= 0) {
      readyQueueOrder.splice(readyIndex, 1)
    }

    if (removedHeight > 0) {
      // Keep the current content anchored when we evict items above the viewport.
      window.scrollBy(0, -removedHeight)
    }

    return true
  }

  let cursor = 0

  while (readyQueue.size > MAX_READY_QUEUE_SIZE && cursor < readyQueueOrder.length) {
    const candidateId = readyQueueOrder[cursor]

    if (!candidateId) {
      cursor += 1
      continue
    }

    const isPinned =
      priorityQueue.has(candidateId) || retainedPriorityIds.has(candidateId)

    if (isPinned) {
      cursor += 1
      continue
    }

    if (!evictReadyEntry(candidateId)) {
      cursor += 1
    }
  }
}

type UnblockFn = () => void

/**
 * Adds a unique identifier to the intersection blockers set
 * Intersection will not be enabled until the unblock callback is run
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
 * Runs the lazy bus to render the pending and priority queues
 *
 * This will batch the pending renders until the browser is idle
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

  // Disable intersection while we run the lazy bus
  const unblock = blockIntersection()

  /**
   * Moves a small batch into the ready queue so we do not mount too many sections at once.
   * Priority entries are always rendered first.
   */
  const takeNextBatch = (): string[] => {
    const batch: string[] = []

    for (let index = priorityQueueOrder.length - 1; index >= 0; index--) {
      const id = priorityQueueOrder[index]
      if (!id || !priorityQueue.has(id)) {
        continue
      }

      batch.push(id)
      if (batch.length >= PRIORITY_BATCH_SIZE) {
        break
      }
    }

    for (const id of pendingQueue) {
      if (batch.length >= PRIORITY_BATCH_SIZE + LAZY_BATCH_SIZE) {
        break
      }

      batch.push(id)
    }

    return batch
  }

  const scheduleNext = (runner: () => void) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(runner, { timeout: 1500 })
    } else {
      setTimeout(runner, 0)
    }
  }

  const processQueueBatch = async () => {
    const batch = takeNextBatch()

    if (!batch.length) {
      unblock()
      isRunning.value = false
      firstLazyLoadComplete.value = true
      return
    }

    for (const id of batch) {
      addToReadyQueue(id)
      pendingQueue.delete(id)
      if (priorityQueue.delete(id)) {
        removePriorityOrder(id)
      }
    }

    evictReadyQueue()

    await nextTick()

    onRenderComplete.forEach((fn) => fn())
    onRenderComplete.clear()

    if (pendingQueue.size > 0 || priorityQueue.size > 0) {
      scheduleNext(() => {
        // biome-ignore lint/nursery/noFloatingPromises: Expected floating promise
        processQueueBatch()
      })
      return
    }

    unblock()
    isRunning.value = false
    firstLazyLoadComplete.value = true
  }

  scheduleNext(() => {
    // biome-ignore lint/nursery/noFloatingPromises: Expected floating promise
    processQueueBatch()
  })
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
  if (!!id && !readyQueue.has(id) && !priorityQueue.has(id)) {
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

  if (id) {
    touchPriorityOrder(id)
    retainPriorityId(id)
  }
}

/**
 * Requests an item to be rendered again.
 * Useful when an item was evicted from readyQueue and re-enters the viewport.
 */
export const requestLazyRender = (
  id: string | undefined,
  priority = false,
): void => {
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

/** When an element is unmounted we remove it from all queues */
const resetLazyElement = (id: string) => {
  priorityQueue.delete(id)
  removePriorityOrder(id)
  pendingQueue.delete(id)
  readyQueue.delete(id)
  retainedPriorityIds.delete(id)

  const readyIndex = readyQueueOrder.indexOf(id)
  if (readyIndex >= 0) {
    readyQueueOrder.splice(readyIndex, 1)
  }

  const retainedIndex = retainedPriorityOrder.indexOf(id)
  if (retainedIndex >= 0) {
    retainedPriorityOrder.splice(retainedIndex, 1)
  }
}

// ---------------------------------------------------------------------------

/**
 * Tracks the lazy loading state of an element.
 * The element should be conditionally rendered using the isReady property.
 *
 * @param id - The id of the element to track
 * @returns An object with the isReady property
 */
export function useLazyBus(id: string) {
  addToPendingQueue(id)

  onBeforeUnmount(() => {
    resetLazyElement(id)
  })

  return {
    isReady: computed(() => typeof window === 'undefined' || priorityQueue.has(id) || readyQueue.has(id)),
  }
}

/**
 * Scroll to possible lazy element
 *
 * Will ensure that all parents are expanded and set to priority load before scrolling
 *
 * Similar to scrollToId BUT in the case of a section not being open,
 * it uses the lazyBus to ensure the section is open before scrolling to it
 *
 * Requires handlers to expand and lookup navigation items so that we can
 * traverse the parent structure and load all required items
 */
export const scrollToLazy = (
  id: string,
  setExpanded: (id: string, value: boolean) => void,
  getEntryById: (id: string) => { id: string; parent?: { id: string }; children?: { id: string }[] } | undefined,
) => {
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
  const { rawId } = getSchemaParamsFromId(id)

  addToPriorityQueue(id)
  addToPriorityQueue(rawId)

  // When there are children we ensure the first 2 are loaded
  if (item?.children) {
    item.children.slice(0, 2).forEach((child) => {
      addToPriorityQueue(child.id)
    })
  }

  // When there are sibling items we attempt to load the next 2 to better fill the viewport
  if (item?.parent) {
    const parent = getEntryById(item.parent.id)
    const elementIdx = parent?.children?.findIndex((child) => child.id === id)
    if (elementIdx !== undefined && elementIdx >= 0) {
      parent?.children?.slice(elementIdx, elementIdx + 2).forEach((child) => {
        addToPriorityQueue(child.id)
      })
    }
  }

  /** Expand target and all parents first so their Lazy slots render and child placeholders mount. */
  setExpanded(rawId, true)
  const addParents = (currentId: string) => {
    const parent = getEntryById(currentId)?.parent
    if (parent) {
      addToPriorityQueue(parent.id)
      setExpanded(parent.id, true)
      addParents(parent.id)
    }
  }
  addParents(rawId)

  /** Scroll after Vue has flushed so expanded parents render their slots and child placeholders mount. */
  void nextTick(() => {
    tryScroll(id, Date.now() + SCROLL_RETRY_MS, unblock, unfreeze)
  })
}

/**
 * Tiny wrapper around the scrollIntoView API
 * Retries up to the stopTime in case the element is not yet rendered
 *
 * @param id - The id of the element to scroll to
 * @param stopTime - The time to stop retrying in unix milliseconds
 */
const tryScroll = (id: string, stopTime: number, onComplete: UnblockFn, onFailure?: () => void): void => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({
      block: 'start',
    })
    onComplete()
  } else if (Date.now() < stopTime) {
    requestAnimationFrame(() => tryScroll(id, stopTime, onComplete))
  } else {
    // If the scroll has expired we enable intersection again
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
      element.scrollIntoView({
        block: 'start',
      })
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
