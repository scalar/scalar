import { useRafFn } from '@vueuse/core'
import { reactive } from 'vue'

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
  /** Callback to execute when all IDs are loaded */
  onAllIdsLoaded?: () => void
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
 * RAF function for handling idle detection and pending ID processing.
 * Uses VueUse's useRafFn for better performance and control.
 */
let rafHandler: ReturnType<typeof useRafFn> | null = null

/**
 * Idle detection state
 */
let lastActivityTime = 0
const idleTimeout = 100 // 100ms of no activity = idle
let isCurrentlyIdle = false

/**
 * Sets up idle detection automatically when needed.
 * Only sets up once to avoid multiple listeners.
 */
function ensureIdleDetectionSetup(): void {
  if (globalState.idleDetectionSetup) {
    return
  }

  globalState.idleDetectionSetup = true
  setupIdleDetection()
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

  console.log(`[LazyLoading] New ID: "${id}"`)
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
 * Sets up a callback to be triggered when all registered IDs are loaded.
 * The callback will be called immediately if all IDs are already loaded,
 * or when the last ID gets loaded.
 *
 * @param callback - Function to execute when all IDs are loaded
 */
export function onAllIdsLoaded(callback: () => void): void {
  globalState.onAllIdsLoaded = callback

  // Check if all IDs are already loaded
  if (areAllIdsLoaded()) {
    callback()
  }
}

/**
 * Checks if all registered IDs have been loaded.
 * An ID is considered loaded when its load control flag is set to true.
 *
 * @returns true if all IDs are loaded, false otherwise
 */
export function areAllIdsLoaded(): boolean {
  if (globalState.registeredIds.size === 0) {
    return true // No IDs registered means all are "loaded"
  }

  return Array.from(globalState.loadControlFlags.values()).every(Boolean)
}

/**
 * Internal function to check and trigger the all-ids-loaded callback.
 * Called whenever an ID's load state changes.
 */
function checkAndTriggerAllIdsLoaded(): void {
  if (globalState.onAllIdsLoaded && areAllIdsLoaded()) {
    globalState.onAllIdsLoaded()
  }
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

  // Check if all IDs are now loaded
  checkAndTriggerAllIdsLoaded()

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
 * Sets up idle detection using VueUse's useRafFn.
 * Triggers the callback every time the browser becomes idle.
 *
 * @param callback - Function to execute when browser becomes idle
 * @param everyIdle - Whether to trigger on every idle event (default: false for backward compatibility)
 */
export function onIdle(callback: () => void, everyIdle: boolean = false): void {
  if (everyIdle) {
    // Store the callback for every idle event
    globalState.onEveryIdle = callback
  } else {
    // Store the callback for first idle only (backward compatibility)
    globalState.onFirstIdle = callback
  }

  // Set up idle detection if not already set up
  if (!globalState.idleDetectionSetup) {
    setupIdleDetection()
  }
}

/**
 * Sets up idle detection using RAF with proper idle timing.
 * Uses VueUse's useRafFn but with idle detection logic.
 */
function setupIdleDetection(): void {
  if (rafHandler) {
    // If RAF handler already exists, resume it
    rafHandler.resume()
    return
  }

  // Initialize activity tracking
  lastActivityTime = Date.now()
  isCurrentlyIdle = false

  // Create new RAF handler for idle detection
  rafHandler = useRafFn(
    () => {
      handleIdleDetection()
    },
    { immediate: true },
  )
}

/**
 * Internal function to handle idle detection.
 * Checks if enough time has passed since last activity to consider the browser idle.
 */
function handleIdleDetection(): void {
  const now = Date.now()
  const timeSinceLastActivity = now - lastActivityTime

  // Check if we should be idle
  const shouldBeIdle = timeSinceLastActivity >= idleTimeout

  // Handle first idle event
  if (!globalState.hasBeenIdle && shouldBeIdle) {
    globalState.hasBeenIdle = true
    isCurrentlyIdle = true
    console.log('[LazyLoading] Browser is idle for the first time')

    if (globalState.onFirstIdle) {
      globalState.onFirstIdle()
    }
  }

  // Handle continuous idle events
  if (shouldBeIdle && !isCurrentlyIdle) {
    isCurrentlyIdle = true
    console.log('[LazyLoading] Browser became idle again')
  }

  // Process pending IDs when idle
  if (shouldBeIdle && globalState.pendingIds.length > 0) {
    // Process one ID per idle cycle to avoid overwhelming the browser
    const nextId = globalState.pendingIds.shift()!
    globalState.loadControlFlags.set(nextId, true)
    console.log(`[LazyLoading] Load "${nextId}" (idle)`)

    // Check if all IDs are now loaded
    checkAndTriggerAllIdsLoaded()
  }

  // Execute the every idle callback when we become idle
  if (shouldBeIdle && globalState.onEveryIdle) {
    globalState.onEveryIdle()
  }

  // Reset idle state if activity detected
  if (!shouldBeIdle && isCurrentlyIdle) {
    isCurrentlyIdle = false
    console.log('[LazyLoading] Browser activity detected')
  }
}

/**
 * Updates the last activity time to reset idle detection.
 * Call this when user activity is detected.
 */
export function updateActivityTime(): void {
  lastActivityTime = Date.now()
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
  globalState.onAllIdsLoaded = undefined

  // Stop and clean up RAF handler
  if (rafHandler) {
    rafHandler.pause()
    rafHandler = null
  }

  // Reset idle detection state
  lastActivityTime = 0
  isCurrentlyIdle = false

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

/**
 * Pauses the RAF-based idle detection.
 * Useful for temporarily stopping lazy loading processing.
 */
export function pauseIdleDetection(): void {
  if (rafHandler) {
    rafHandler.pause()
  }
}

/**
 * Resumes the RAF-based idle detection.
 * Useful for resuming lazy loading processing after pausing.
 */
export function resumeIdleDetection(): void {
  if (rafHandler) {
    rafHandler.resume()
  }
}
