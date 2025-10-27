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

/** Tracks when the initial load is complete.
 * We will have placeholder content to allow the active item to be scrolled to the top while
 * the rest of the content is loaded.
 */
export const firstLazyLoadComplete = ref(false)

/** List of unique identifiers that are blocking intersection */
const intersectionBlockers = reactive<Set<string>>(new Set())

const onRenderComplete = new Set<() => void>()

/** Adds a one time callback to be executed when the lazy bus has finished loading */
const addLazyCompleteCallback = (callback: (() => void) | undefined) => {
  if (callback) {
    onRenderComplete.add(callback)
  }
}

type UnblockFn = () => void

/**
 * Adds a unique identifier to the intersection blockers set
 * Intersection will not be enabled until the unblock callback is run
 */
const blockIntersection = (): UnblockFn => {
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

  // Disable intersection while we run the lazy bus
  const unblock = blockIntersection()

  /**
   * Sets all the pending elements into the ready queue
   * After waiting for Vue to update the DOM we execute the callbacks and unblock intersection
   */
  const executeRender = async () => {
    if (pendingQueue.size > 0) {
      isRunning.value = true

      for (const id of pendingQueue.values()) {
        readyQueue.add(id)
        pendingQueue.delete(id)
        priorityQueue.delete(id)
      }

      for (const id of priorityQueue.values()) {
        readyQueue.add(id)
        priorityQueue.delete(id)
        pendingQueue.delete(id)
      }
    }

    await nextTick()

    onRenderComplete.forEach((fn) => fn())
    onRenderComplete.clear()
    unblock()
    isRunning.value = false
    firstLazyLoadComplete.value = true
  }

  if (window.requestIdleCallback) {
    window.requestIdleCallback(executeRender, { timeout: 1500 })
  } else {
    // biome-ignore lint/nursery/noFloatingPromises: Expected floating promise
    nextTick(executeRender)
  }
}

/**
 * Run the lazy bus when the queue changes and is not currently running
 * Debounce so that multiple changes to the queue are batched together
 */
watchDebounced(
  [() => pendingQueue.size, () => isRunning.value],
  () => {
    if (pendingQueue.size > 0 && !isRunning.value) {
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
 * We only add elements to the priority queue if they are not already in the ready queue
 */
const addToPriorityQueue = (id: string | undefined) => {
  if (id && !readyQueue.has(id)) {
    priorityQueue.add(id)
  }
}

/** When an element is unmounted we remove it from all queues */
const resetLazyElement = (id: string) => {
  priorityQueue.delete(id)
  pendingQueue.delete(id)
  readyQueue.delete(id)
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
  getEntryById: (id: string) => { id: string; parent?: { id: string } } | undefined,
) => {
  /**
   * If the element is lazy we must freeze the element so that it does not move until after the next lazy bus run
   * If the element never loads then the scroll onFailure callback will be run to unfreeze the element
   */
  const isLazy = !readyQueue.has(id)
  const unfreeze = isLazy ? freeze(id) : undefined
  addLazyCompleteCallback(unfreeze)

  // Disable intersection while we scroll to the element
  const unblock = blockIntersection()
  const { rawId } = getSchemaParamsFromId(id)

  addToPriorityQueue(id)
  setExpanded(rawId, true)
  addToPriorityQueue(rawId)

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

  /** Scroll to the element targeted */
  tryScroll(id, Date.now() + 1000, unblock, unfreeze)
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

export const freeze = (id: string) => {
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
