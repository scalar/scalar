import { reactive } from 'vue'

/**
 * The default timeout for lazy loading,
 * if requestIdleCallback is not available.
 */
const DEFAULT_LAZY_LOADING_TIMEOUT = 300

/**
 * Global state for lazy loading management.
 * Tracks registered IDs, idle state, and loading control flags across the application.
 */
type LazyLoadingState = {
  /** Set of registered lazy loading IDs */
  registeredIds: Set<string>
  /** Whether the browser has been idle at least once */
  hasBeenIdle: boolean
  /** Callback to execute when browser becomes idle for the first time */
  onFirstIdle?: () => void
  /** Map of ID to boolean flag controlling whether the ID should be loaded or wait */
  loadControlFlags: Map<string, boolean>
  /** Array of IDs waiting to be loaded, in order of registration */
  pendingIds: string[]
  /** Callback to execute every time the browser becomes idle */
  onEveryIdle?: () => void
  /** Whether idle detection has been set up */
  idleDetectionSetup: boolean
}

/**
 * Global state instance for lazy loading.
 * This ensures all components share the same state.
 * Made reactive so Vue components can track changes.
 */
export const globalState = reactive<LazyLoadingState>({
  registeredIds: new Set(),
  hasBeenIdle: false,
  loadControlFlags: new Map(),
  pendingIds: [],
  idleDetectionSetup: false,
})

/**
 * Sets up idle detection automatically when needed.
 * Only sets up once to avoid multiple listeners.
 */
function ensureIdleDetectionSetup(): void {
  if (globalState.idleDetectionSetup) {
    return
  }

  globalState.idleDetectionSetup = true
  setupContinuousIdleDetection()
  console.log('[LazyLoading] Idle detection set up automatically')
}

/**
 * Registers a new ID in the global lazy loading state.
 * Logs when an ID is registered for debugging purposes.
 *
 * @param id - The unique identifier to register
 * @param shouldLoad - Whether this ID should be loaded immediately (default: false)
 * @returns true if the ID was newly registered, false if it already existed
 */
export function registerId(id: string, shouldLoad: boolean = false): boolean {
  if (globalState.registeredIds.has(id)) {
    console.log(`[LazyLoading] ID "${id}" already registered`)
    return false
  }

  globalState.registeredIds.add(id)
  globalState.loadControlFlags.set(id, shouldLoad)

  // Add to pending IDs if it should wait
  if (!shouldLoad) {
    globalState.pendingIds.push(id)
  }

  // Set up idle detection automatically when first ID is registered
  if (!shouldLoad) {
    ensureIdleDetectionSetup()
  }

  console.log(`[LazyLoading] Registered new ID: "${id}"`)
  return true
}

/**
 * Unregisters an ID from the global lazy loading state.
 *
 * @param id - The unique identifier to unregister
 * @returns true if the ID was found and removed, false if it didn't exist
 */
export function unregisterId(id: string): boolean {
  const wasRegistered = globalState.registeredIds.has(id)
  if (wasRegistered) {
    globalState.registeredIds.delete(id)
    globalState.loadControlFlags.delete(id)

    // Remove from pending IDs
    const pendingIndex = globalState.pendingIds.indexOf(id)
    if (pendingIndex > -1) {
      globalState.pendingIds.splice(pendingIndex, 1)
    }

    console.log(`[LazyLoading] Unregistered ID: "${id}"`)
  }
  return wasRegistered
}

/**
 * Checks if an ID is registered in the global state.
 *
 * @param id - The unique identifier to check
 * @returns true if the ID is registered, false otherwise
 */
export function isIdRegistered(id: string): boolean {
  return globalState.registeredIds.has(id)
}

/**
 * Sets the load control flag for a specific ID.
 * Controls whether the ID should be loaded immediately or wait.
 *
 * @param id - The unique identifier to set the flag for
 * @param shouldLoad - Whether this ID should be loaded immediately
 * @returns true if the ID was found and flag was set, false if ID doesn't exist
 */
export function setLoadControlFlag(id: string, shouldLoad: boolean): boolean {
  if (!globalState.registeredIds.has(id)) {
    console.log(`[LazyLoading] Cannot set load flag for unregistered ID: "${id}"`)
    return false
  }

  globalState.loadControlFlags.set(id, shouldLoad)
  console.log(`[LazyLoading] Set load flag for ID "${id}": ${shouldLoad}`)
  return true
}

/**
 * Gets the load control flag for a specific ID.
 *
 * @param id - The unique identifier to get the flag for
 * @returns the load control flag, or undefined if ID doesn't exist
 */
export function getLoadControlFlag(id: string): boolean | undefined {
  return globalState.loadControlFlags.get(id)
}

/**
 * Checks if an ID should be loaded immediately.
 *
 * @param id - The unique identifier to check
 * @returns true if the ID should be loaded, false if it should wait, undefined if ID doesn't exist
 */
export function shouldLoadId(id: string): boolean | undefined {
  return globalState.loadControlFlags.get(id)
}

/**
 * Gets all currently registered IDs.
 *
 * @returns Array of all registered IDs
 */
export function getRegisteredIds(): readonly string[] {
  return Array.from(globalState.registeredIds)
}

/**
 * Gets all IDs that should be loaded immediately.
 *
 * @returns Array of IDs that have load control flag set to true
 */
export function getIdsToLoad(): readonly string[] {
  return Array.from(globalState.loadControlFlags.entries())
    .filter(([, shouldLoad]) => shouldLoad)
    .map(([id]) => id)
}

/**
 * Gets all IDs that should wait (not load immediately).
 *
 * @returns Array of IDs that have load control flag set to false
 */
export function getIdsToWait(): readonly string[] {
  return Array.from(globalState.loadControlFlags.entries())
    .filter(([, shouldLoad]) => !shouldLoad)
    .map(([id]) => id)
}

/**
 * Gets the count of registered IDs.
 *
 * @returns Number of registered IDs
 */
export function getRegisteredCount(): number {
  return globalState.registeredIds.size
}

/**
 * Gets the count of IDs that should be loaded immediately.
 *
 * @returns Number of IDs with load control flag set to true
 */
export function getLoadCount(): number {
  return Array.from(globalState.loadControlFlags.values()).filter(Boolean).length
}

/**
 * Gets the count of IDs that should wait.
 *
 * @returns Number of IDs with load control flag set to false
 */
export function getWaitCount(): number {
  return Array.from(globalState.loadControlFlags.values()).filter((flag) => !flag).length
}

/**
 * Sets up idle detection using the browser's requestIdleCallback API.
 * Triggers the callback every time the browser becomes idle.
 *
 * @param callback - Function to execute when browser becomes idle
 * @param everyIdle - Whether to trigger on every idle event (default: false for backward compatibility)
 */
export function onIdle(callback: () => void, everyIdle: boolean = false): void {
  if (everyIdle) {
    // Store the callback for every idle event
    globalState.onEveryIdle = callback

    // Set up continuous idle detection
    setupContinuousIdleDetection()
  } else {
    // Store the callback for first idle only (backward compatibility)
    globalState.onFirstIdle = callback

    // Only set up idle detection if we haven't been idle yet
    if (!globalState.hasBeenIdle) {
      setupFirstIdleDetection()
    }
  }
}

/**
 * Sets up continuous idle detection that triggers on every idle event.
 */
function setupContinuousIdleDetection(): void {
  if ('requestIdleCallback' in window) {
    // Use native requestIdleCallback with a wrapper to continue listening
    const scheduleNextIdle = () => {
      window.requestIdleCallback(() => {
        handleEveryIdle()
        // Schedule the next idle callback
        scheduleNextIdle()
      })
    }
    scheduleNextIdle()
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    // Use setInterval to simulate idle detection
    setInterval(() => {
      handleEveryIdle()
    }, 1000)
  }
}

/**
 * Sets up idle detection for the first idle event only.
 */
function setupFirstIdleDetection(): void {
  if ('requestIdleCallback' in window) {
    // Use native requestIdleCallback
    window.requestIdleCallback(() => {
      handleFirstIdle()
    })
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    // Use setTimeout with a reasonable delay
    setTimeout(() => {
      handleFirstIdle()
    }, DEFAULT_LAZY_LOADING_TIMEOUT)
  }
}

/**
 * Internal function to handle every idle event.
 * Sets the next pending ID to true and executes the callback.
 */
function handleEveryIdle(): void {
  // Set the next pending ID to true if there are any
  if (globalState.pendingIds.length > 0) {
    const nextId = globalState.pendingIds.shift()!
    globalState.loadControlFlags.set(nextId, true)
    console.log(`[LazyLoading] Set next pending ID "${nextId}" to true during idle`)
  }

  if (globalState.onEveryIdle) {
    globalState.onEveryIdle()
  }
}

/**
 * Internal function to handle the first idle event.
 * Marks the state as idle and executes the callback.
 */
function handleFirstIdle(): void {
  if (!globalState.hasBeenIdle) {
    globalState.hasBeenIdle = true
    console.log('[LazyLoading] Browser is idle for the first time')

    if (globalState.onFirstIdle) {
      globalState.onFirstIdle()
    }
  }
}

/**
 * Gets the next pending ID without removing it from the queue.
 *
 * @returns The next pending ID, or undefined if none are pending
 */
export function getNextPendingId(): string | undefined {
  return globalState.pendingIds[0]
}

/**
 * Gets all pending IDs.
 *
 * @returns Array of pending IDs in order
 */
export function getPendingIds(): readonly string[] {
  return [...globalState.pendingIds]
}

/**
 * Gets the count of pending IDs.
 *
 * @returns Number of pending IDs
 */
export function getPendingCount(): number {
  return globalState.pendingIds.length
}

/**
 * Resets the global state (useful for testing or cleanup).
 * Clears all registered IDs, resets idle state, and clears load control flags.
 */
export function resetState(): void {
  globalState.registeredIds.clear()
  globalState.hasBeenIdle = false
  globalState.onFirstIdle = undefined
  globalState.loadControlFlags.clear()
  globalState.pendingIds = []
  globalState.idleDetectionSetup = false
  console.log('[LazyLoading] Global state reset')
}

/**
 * Gets the current idle state.
 *
 * @returns true if the browser has been idle at least once, false otherwise
 */
export function hasBeenIdle(): boolean {
  return globalState.hasBeenIdle
}
