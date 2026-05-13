import { type Result, err, ok } from '@scalar/helpers/types/result'
import { useToasts } from '@scalar/use-toasts'
import { coerce, validate } from '@scalar/validation'
import { jwtDecode } from 'jwt-decode'
import { computed, readonly, ref } from 'vue'

import { env } from '@/environment'
import { isTokenExpired } from '@/helpers/auth/is-token-expired'
import { type AccessTokenPayload, accessTokenPayloadSchema, tokenResponseSchema } from '@/helpers/auth/schema'
import { queryClient } from '@/helpers/query-client'

const { toast } = useToasts()

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

  // Cancel all queries and clear cache
  void queryClient.cancelQueries()
  queryClient.clear()

  // Lets hard route to ensure we are no longer on the team workspace
  window.location.href = '/'
}

/**
 * Discriminated reasons a token refresh attempt can fail. Callers can
 * `switch` on these to decide whether to retry, log out, or just toast.
 *
 * - `no-refresh-token` – Nothing to send; treat as already logged out.
 * - `unauthorized` – Server rejected the token (401/403); user was logged out.
 * - `server-error` – Non-2xx other than 401/403; tokens unchanged.
 * - `invalid-response` – Body failed schema validation; tokens unchanged.
 * - `network-error` – `fetch` threw; tokens unchanged.
 * - `lock-busy` – Another tab holds the lock; success will arrive via the
 *   `storage` event. Background callers can ignore this; team-switch callers
 *   should treat it as a failure because the other tab will not be refreshing
 *   with our `teamUid`.
 */
type RefreshTokensError =
  | 'no-refresh-token'
  | 'unauthorized'
  | 'server-error'
  | 'invalid-response'
  | 'network-error'
  | 'lock-busy'

type RefreshTokensResult = Result<AccessTokenPayload, RefreshTokensError>

/**
 * In-flight refresh promises keyed by `teamUid` (or an empty string for
 * background refreshes). This ensures that a team-switch refresh is never
 * silently deduped into an unrelated background refresh, while concurrent
 * callers with the *same* `teamUid` still share a single request.
 *
 * Cross-tab deduplication is handled separately via `navigator.locks`.
 */
const pendingRefreshes = new Map<string, Promise<RefreshTokensResult>>()

/**
 * Call POST /core/login/refresh and update token state.
 *
 * Returns a discriminated {@link Result} so callers know whether the refresh
 * succeeded and, on failure, can branch on the specific error code.
 *
 * Concurrent callers in the same tab share a single in-flight request. A
 * `navigator.locks` request additionally prevents concurrent refreshes across
 * tabs; when the lock is already held elsewhere we no-op and let the winning
 * tab propagate the result via the `storage` event.
 *
 * @example
 * const result = await refreshTokens(teamUid)
 * if (result.ok) {
 *   console.log('Refreshed for', result.data.email)
 * } else {
 *   switch (result.error) {
 *     case 'unauthorized':
 *       // Already logged out — bounce to login page
 *       break
 *     case 'lock-busy':
 *     case 'network-error':
 *     case 'server-error':
 *       // Transient — caller may retry or ignore
 *       break
 *     default:
 *       break
 *   }
 * }
 */
const refreshTokens = (teamUid?: string): Promise<RefreshTokensResult> => {
  const dedupeKey = teamUid ?? ''

  const existing = pendingRefreshes.get(dedupeKey)
  if (existing) {
    return existing
  }

  const token = refreshToken.value
  if (!token) {
    return Promise.resolve(err('no-refresh-token', 'No refresh token available'))
  }

  const execute = async (): Promise<RefreshTokensResult> => {
    try {
      const response = await fetch(`${env.VITE_SERVICES_URL}/core/login/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          refreshToken: token,
          ...(teamUid ? { teamUid } : {}),
        }),
      })

      if (response.status === 401 || response.status === 403) {
        logout()
        return err('unauthorized', 'Refresh token was rejected')
      }

      if (!response.ok) {
        toast('Token refresh failed', 'error')
        return err('server-error', `Token refresh failed with status ${response.status}`)
      }

      const json = await response.json()

      if (!validate(tokenResponseSchema, json)) {
        toast('Token refresh returned an invalid response', 'error')
        return err('invalid-response', 'Token refresh returned an invalid response')
      }

      const data = coerce(tokenResponseSchema, json)
      setTokens(data.accessToken, data.refreshToken)

      // `tokenData` is a computed derived from `accessToken` — it is
      // synchronously invalidated by `setTokens` above, so reading
      // `.value` here always returns the freshly decoded payload.
      if (!tokenData.value) {
        return err('invalid-response', 'Token was stored but could not be decoded')
      }
      return ok(tokenData.value)
    } catch {
      toast('Could not refresh token', 'error')
      return err('network-error', 'Could not reach the auth service')
    }
  }

  const run = async (): Promise<RefreshTokensResult> => {
    if (window?.navigator?.locks?.request) {
      // The `LockManager.request` generic struggles with discriminated
      // unions so we widen to `unknown` and narrow back afterwards.
      const result: unknown = await window.navigator.locks.request(
        'scalar-refresh-request',
        { ifAvailable: true },
        async (lock) => (lock ? execute() : err('lock-busy', 'Another tab is refreshing')),
      )
      return (result as RefreshTokensResult | undefined) ?? err('lock-busy', 'Another tab is refreshing')
    }

    return execute()
  }

  const promise = run().finally(() => {
    pendingRefreshes.delete(dedupeKey)
  })

  pendingRefreshes.set(dedupeKey, promise)

  return promise
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
  accessToken,
  isLoggedIn: readonly(isLoggedIn),
  logout,
  refreshTokens,
  setTokens,
  tokenData,
})
