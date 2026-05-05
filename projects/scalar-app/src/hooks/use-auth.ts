import { coerce, validate } from '@scalar/validation'
import { jwtDecode } from 'jwt-decode'
import { computed, readonly, ref } from 'vue'

import { env } from '@/environment'
import { isTokenExpired } from '@/helpers/auth/is-token-expired'
import { type AccessTokenPayload, accessTokenPayloadSchema, tokenResponseSchema } from '@/helpers/auth/schema'
import { queryClient } from '@/helpers/query-client'

const ACCESS_TOKEN_KEY = 'scalar-access-token'
const REFRESH_TOKEN_KEY = 'scalar-refresh-token'

const accessToken = ref<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY))
const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY))

/** Set our token state + local storage, rejecting malformed or schema-invalid tokens */
const setTokens = (access: string, refresh: string) => {
  try {
    const payload = jwtDecode(access)
    jwtDecode(refresh)

    if (!validate(accessTokenPayloadSchema, payload)) {
      if (import.meta.env.DEV) {
        console.warn('[setTokens]: Access token payload failed schema validation')
      }
      return
    }
  } catch {
    if (import.meta.env.DEV) {
      console.warn('[setTokens]: Received malformed token(s)')
    }
    return
  }

  accessToken.value = access
  refreshToken.value = refresh

  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

/** Reactive token payload decoded from the access token JWT */
const tokenData = computed<AccessTokenPayload | null>(() => {
  if (!accessToken.value) {
    return null
  }

  try {
    const payload = jwtDecode<Record<string, unknown>>(accessToken.value)
    if (!validate(accessTokenPayloadSchema, payload)) {
      return null
    }

    const { email, role, ...rest } = coerce(accessTokenPayloadSchema, payload)
    return { ...rest, email: email ?? null, role: role ?? 'viewer' }
  } catch {
    return null
  }
})

/** Tracks if the user is logged in */
const isLoggedIn = computed(() => Boolean(tokenData.value?.email))

const getAccessToken = (): string | null => accessToken.value

/** Clear tokens and wipe all query caches */
const logout = () => {
  accessToken.value = null
  refreshToken.value = null

  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)

  queryClient.clear()
}

/**
 * In-flight refresh promise used to dedupe concurrent callers within this tab.
 * Cross-tab deduplication is handled separately via `navigator.locks`.
 */
let pendingRefresh: Promise<void> | null = null

/**
 * Call POST /core/login/refresh and update token state.
 *
 * Concurrent callers in the same tab share a single in-flight request. A
 * `navigator.locks` request additionally prevents concurrent refreshes across
 * tabs; when the lock is already held elsewhere we no-op and let the winning
 * tab propagate the result via the `storage` event.
 */
const refreshTokens = (): Promise<void> => {
  if (pendingRefresh) {
    return pendingRefresh
  }

  const token = refreshToken.value
  if (!token) {
    return Promise.resolve()
  }

  const execute = async (): Promise<void> => {
    try {
      const response = await fetch(`${env.VITE_SERVICES_URL}/core/login/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: token }),
      })

      if (response.status === 401 || response.status === 403) {
        logout()
        return
      }

      if (!response.ok) {
        console.warn('[useAuth]: Token refresh failed with status', response.status)
        return
      }

      const json = await response.json()

      if (!validate(tokenResponseSchema, json)) {
        console.warn('[useAuth]: Token refresh returned an invalid response')
        return
      }

      const data = coerce(tokenResponseSchema, json)
      setTokens(data.accessToken, data.refreshToken)
    } catch {
      console.warn('[useAuth]: Could not refresh token')
    }
  }

  const run = async (): Promise<void> => {
    if (window?.navigator?.locks?.request) {
      await window.navigator.locks.request('scalar-refresh-request', { ifAvailable: true }, async (lock) =>
        lock ? execute() : undefined,
      )
      return
    }

    await execute()
  }

  pendingRefresh = run().finally(() => {
    pendingRefresh = null
  })

  return pendingRefresh
}

/**
 * Ensure the access token is fresh, refreshing if it is near expiry.
 *
 * Exported so callers (e.g. before a critical request) can `await` a freshness
 * guarantee. Routine API requests should rely on the API layer's own
 * request-time refresh + 401-retry, not this function.
 */
const checkRefresh = async (): Promise<void> => {
  if (!accessToken.value || !refreshToken.value) {
    return
  }
  if (!isTokenExpired(accessToken.value)) {
    return
  }

  if (isTokenExpired(refreshToken.value)) {
    logout()
    return
  }

  await refreshTokens()
}

if (typeof window !== 'undefined') {
  // Refresh when the tab regains focus or becomes visible (covers laptop
  // wake-from-sleep and mobile Safari where `focus` is unreliable). Both may
  // fire together; `refreshTokens` dedupes via `pendingRefresh`.
  window.addEventListener('focus', () => {
    void checkRefresh()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void checkRefresh()
    }
  })

  // When tokens are updated in another tab, sync local state
  window.addEventListener('storage', (event) => {
    // Relies on refresh token always being written after access token
    if (event.key !== REFRESH_TOKEN_KEY) {
      return
    }

    const newRefresh = event.newValue
    if (newRefresh === refreshToken.value) {
      return
    }

    if (!newRefresh || isTokenExpired(newRefresh)) {
      logout()
    } else {
      accessToken.value = localStorage.getItem(ACCESS_TOKEN_KEY)
      refreshToken.value = newRefresh
    }
  })

  // Kick off an initial freshness check on module load
  void checkRefresh()
}

/** Interface for auth related data */
export const useAuth = () => ({
  checkRefresh,
  getAccessToken,
  isLoggedIn: readonly(isLoggedIn),
  logout,
  refreshTokens,
  setTokens,
  tokenData,
})
