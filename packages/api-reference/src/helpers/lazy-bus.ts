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
const isRunning = ref(false)

/** How long tryScroll keeps retrying to find the element (ms). */
const SCROLL_RETRY_MS = 3000

/** Tracks when the initial load is complete. */
export const firstLazyLoadComplete = ref(false)

const intersectionBlockers = reactive<Set<string>>(new Set())
const onRenderComplete = new Set<() => void>()

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
  return () => setTimeout(() => intersectionBlockers.delete(blockId), 100)
}

export const intersectionEnabled = computed(() => intersectionBlockers.size === 0)

/**
 * Processes the full queue: priority first, then pending. Blocks intersection while
 * rendering so the viewport does not jump. No eviction — items stay in readyQueue.
 */
const runLazyBus = () => {
  if (typeof window === 'undefined') {
    return
  }

  if (isRunning.value) {
    return
  }

  isRunning.value = true
  const unblock = blockIntersection()

  const processQueue = async () => {
    const priorityIds = [...priorityQueue]
    const pendingIds = [...pendingQueue]

    if (priorityIds.length === 0 && pendingIds.length === 0) {
      unblock()
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

    unblock()
    isRunning.value = false
    firstLazyLoadComplete.value = true
  }

  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      // biome-ignore lint/nursery/noFloatingPromises: Expected floating promise
      processQueue()
    }, { timeout: 1500 })
  } else {
    // biome-ignore lint/nursery/noFloatingPromises: Expected floating promise
    nextTick(processQueue)
  }
}

watchDebounced(
  [() => pendingQueue.size, () => priorityQueue.size, () => isRunning.value],
  () => {
    if ((pendingQueue.size > 0 || priorityQueue.size > 0) && !isRunning.value) {
      runLazyBus()
    }
  },
  { debounce: 300, maxWait: 1500 },
)

const addToPendingQueue = (id: string | undefined) => {
  if (id && !readyQueue.has(id) && !priorityQueue.has(id)) {
    pendingQueue.add(id)
  }
}

export const addToPriorityQueue = (id: string | undefined) => {
  if (id && !priorityQueue.has(id)) {
    priorityQueue.add(id)
  }
}

/**
 * Request an item to be rendered (e.g. when it re-enters the overscan zone).
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

const resetLazyElement = (id: string) => {
  priorityQueue.delete(id)
  pendingQueue.delete(id)
  readyQueue.delete(id)
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
    isReady: computed(
      () =>
        typeof window === 'undefined' ||
        priorityQueue.has(id) ||
        readyQueue.has(id),
    ),
  }
}

/**
 * Scroll to a possibly lazy-loaded element. Expands parents and adds target (and
 * parents) to the priority queue, then scrolls after Vue has flushed.
 */
export const scrollToLazy = (
  id: string,
  setExpanded: (id: string, value: boolean) => void,
  getEntryById: (id: string) =>
    | { id: string; parent?: { id: string }; children?: { id: string }[] }
    | undefined,
) => {
  const item = getEntryById(id)
  const isLazy =
    !readyQueue.has(id) ||
    item?.children?.some((child) => !readyQueue.has(child.id))
  const unfreeze = isLazy ? freeze(id) : undefined
  addLazyCompleteCallback(unfreeze)

  const unblock = blockIntersection()
  const { rawId } = getSchemaParamsFromId(id)

  addToPriorityQueue(id)
  addToPriorityQueue(rawId)

  if (item?.children) {
    item.children.slice(0, 2).forEach((child) => addToPriorityQueue(child.id))
  }
  if (item?.parent) {
    const parent = getEntryById(item.parent.id)
    const elementIdx = parent?.children?.findIndex((child) => child.id === id)
    if (elementIdx !== undefined && elementIdx >= 0) {
      parent?.children
        ?.slice(elementIdx, elementIdx + 2)
        .forEach((child) => addToPriorityQueue(child.id))
    }
  }

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

  void nextTick(() => {
    tryScroll(id, Date.now() + SCROLL_RETRY_MS, unblock, unfreeze)
  })
}

const tryScroll = (
  id: string,
  stopTime: number,
  onComplete: UnblockFn,
  onFailure?: () => void,
): void => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ block: 'start' })
    onComplete()
  } else if (Date.now() < stopTime) {
    requestAnimationFrame(() => tryScroll(id, stopTime, onComplete, onFailure))
  } else {
    onComplete()
    onFailure?.()
  }
}

const freeze = (id: string): (() => void) => {
  let stop = false
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
