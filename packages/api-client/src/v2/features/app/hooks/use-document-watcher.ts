import type { Difference } from '@scalar/json-magic/diff'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type MaybeRefOrGetter, computed, onBeforeUnmount, toValue, watch } from 'vue'

/**
 * Default timeout before the first poll attempt (in milliseconds).
 */
const DEFAULT_INITIAL_TIMEOUT = 5 * 1000 // 5 seconds

/**
 * Maximum timeout cap for exponential backoff (in milliseconds).
 */
const MAX_TIMEOUT = 60 * 1000 // 60 seconds

/**
 * Creates a timer manager for handling polling timeouts.
 *
 * @returns Object with methods to manage the polling timer.
 */
const createTimerManager = () => {
  let timer: ReturnType<typeof setTimeout> | null = null

  /**
   * Clears the current timer if it exists.
   */
  const clear = (): void => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  /**
   * Schedules the next poll after the specified timeout.
   *
   * @param callback - The function to call when the timeout expires.
   * @param timeout - The delay in milliseconds before calling the callback.
   */
  const schedule = (callback: () => void, timeout: number): void => {
    clear()
    timer = setTimeout(callback, timeout)
  }

  return {
    clear,
    schedule,
  }
}

/**
 * Creates a timeout manager that handles exponential backoff on failures.
 *
 * @param initialTimeout - The initial timeout value in milliseconds.
 * @returns Object with methods to manage timeout values.
 */
const createTimeoutManager = (initialTimeout: number) => {
  let currentTimeout = initialTimeout

  /**
   * Resets the timeout to its initial value.
   */
  const reset = (): void => {
    currentTimeout = initialTimeout
  }

  /**
   * Doubles the timeout with exponential backoff, capped at MAX_TIMEOUT.
   */
  const backoff = (): void => {
    currentTimeout = Math.min(currentTimeout * 2, MAX_TIMEOUT)
  }

  /**
   * Gets the current timeout value.
   */
  const get = (): number => currentTimeout

  return {
    reset,
    backoff,
    get,
  }
}

/**
 * Resolves conflicts by preferring remote changes.
 *
 * @param conflicts - Array of conflict tuples from the rebase result.
 * Each tuple contains two arrays: [remote changes, local changes].
 * @returns Array of remote changes to apply.
 */
const resolveConflicts = (conflicts: Array<[Difference<unknown>[], Difference<unknown>[]]>): Difference<unknown>[] => {
  return conflicts.flatMap(([remote]) => remote)
}

/**
 * Watches the specified document in the workspace store and periodically rebases it with its remote source.
 *
 * This utility sets up a watcher on the given document. If the document specifies an 'x-scalar-original-source-url'
 * and watch mode is enabled, this hook polls the remote source and calls `store.rebaseDocument`.
 * If rebase conflicts are detected, it applies automatic conflict resolution by preferring remote changes.
 * Uses exponential backoff on failures to avoid overwhelming the server.
 *
 * @param params - Configuration object for the document watcher.
 * @param params.documentName - The name/key of the document to watch and rebase.
 * @param params.store - The WorkspaceStore instance.
 * @param params.initialTimeout - Initial delay before the first poll attempt (default: 5000ms).
 *
 * @example
 * ```ts
 * import { useDocumentWatcher } from '@/hooks/use-document-watcher'
 * import { useScalarWorkspaceStore } from '@scalar/workspace-store'
 *
 * const store = useScalarWorkspaceStore()
 * useDocumentWatcher({ documentName: 'myApi', store })
 * ```
 */
export const useDocumentWatcher = ({
  documentName,
  store,
  initialTimeout = DEFAULT_INITIAL_TIMEOUT,
}: {
  documentName: MaybeRefOrGetter<string | undefined>
  store: MaybeRefOrGetter<WorkspaceStore | null>
  initialTimeout?: number
}): void => {
  const document = computed(() => {
    const storeValue = toValue(store)
    const documentNameValue = toValue(documentName)
    if (!storeValue || !documentNameValue) {
      return null
    }
    return storeValue.workspace.documents[documentNameValue]
  })

  const timerManager = createTimerManager()
  const timeoutManager = createTimeoutManager(initialTimeout)

  /**
   * Handles a successful poll result (with or without changes).
   */
  const handleSuccess = (): void => {
    timeoutManager.reset()
    timerManager.schedule(poll, timeoutManager.get())
  }

  /**
   * Handles a failed poll result with exponential backoff.
   */
  const handleFailure = (): void => {
    timeoutManager.backoff()
    timerManager.schedule(poll, timeoutManager.get())
  }

  /**
   * Polls the remote document source and attempts to rebase.
   */
  const poll = async (): Promise<void> => {
    const storeValue = toValue(store)
    const documentNameValue = toValue(documentName)
    const sourceUrl = document.value?.['x-scalar-original-source-url']

    if (!storeValue || !documentNameValue || !sourceUrl) {
      return
    }

    const result = await storeValue.rebaseDocument({
      name: documentNameValue,
      url: sourceUrl,
    })

    if (result?.ok) {
      // On conflicts, prefer remote changes by automatically choosing the first option for each conflict tuple
      await result.applyChanges(resolveConflicts(result.conflicts))
      handleSuccess()
    } else if (result?.ok === false && result.type === 'NO_CHANGES_DETECTED') {
      // Still a successful call, just nothing changed
      handleSuccess()
    } else {
      // Exponential backoff on failure
      handleFailure()
    }
  }

  /**
   * Watches for changes to the document's source URL and watch mode.
   * Starts or stops polling based on these values.
   */
  watch(
    [() => document.value?.['x-scalar-original-source-url'], () => document.value?.['x-scalar-watch-mode']],
    ([sourceUrl, watchMode = false]) => {
      const storeValue = toValue(store)

      // Clear timer if store is unavailable
      if (!storeValue) {
        timerManager.clear()
        return
      }

      // Clear any existing timer
      timerManager.clear()

      // Stop polling if source URL is missing or watch mode is disabled
      if (!sourceUrl || !watchMode) {
        timeoutManager.reset()
        return
      }

      // Start polling
      timerManager.schedule(poll, timeoutManager.get())
    },
    { immediate: true },
  )

  // Cleanup timer on component unmount
  onBeforeUnmount(() => {
    timerManager.clear()
  })
}
