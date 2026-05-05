import { type ComputedRef, type Ref, computed, onScopeDispose, readonly, ref } from 'vue'

/**
 * Resolves whether the browser currently believes the client is online.
 * Falls back to `true` when `navigator` is not available (SSR, tests
 * running without `jsdom`) so consumers do not accidentally disable
 * network-dependent UI in those environments.
 */
const resolveInitialOnlineStatus = (): boolean => {
  if (typeof navigator === 'undefined') {
    return true
  }
  return navigator.onLine
}

/**
 * Reactive accessor for the browser's online / offline status.
 *
 * Wires up `online` and `offline` listeners on `window` and exposes
 * a read-only `isOnline` ref alongside a derived `isOffline` boolean
 * for ergonomic template usage. Listeners are cleaned up automatically
 * when the surrounding effect scope (typically a Vue component) is
 * disposed.
 *
 * The hook is safe to call in non-browser contexts: it short-circuits
 * before touching `window` so callers do not have to guard against SSR
 * or test environments themselves. In those cases the client is
 * reported as online and the status simply never changes.
 *
 * @example
 * ```ts
 * const { isOnline, isOffline } = useNetworkStatus()
 *
 * const canPush = computed(() => isOnline.value && hasPendingChanges.value)
 * ```
 */
export const useNetworkStatus = (): {
  /** Reactive flag, `true` while the browser reports a live connection. */
  isOnline: Readonly<Ref<boolean>>
  /** Convenience inverse of `isOnline` for `:disabled` / icon swaps. */
  isOffline: ComputedRef<boolean>
} => {
  const isOnline = ref(resolveInitialOnlineStatus())

  // `window` may be unavailable in SSR or unit tests without a DOM, so
  // we degrade to a static "online" signal rather than throwing.
  if (typeof window !== 'undefined') {
    const handleOnline = (): void => {
      isOnline.value = true
    }
    const handleOffline = (): void => {
      isOnline.value = false
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    onScopeDispose(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    })
  }

  return {
    isOnline: readonly(isOnline),
    isOffline: computed(() => !isOnline.value),
  }
}
