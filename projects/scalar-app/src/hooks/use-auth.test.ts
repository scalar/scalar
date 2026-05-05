import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/environment', () => ({
  env: { VITE_SERVICES_URL: 'https://api.scalar.test' },
}))

import { useAuth } from './use-auth'

/**
 * Build a minimal 3-segment JWT with the given payload.
 * Signatures are not verified by jwt-decode, so a placeholder is fine for tests.
 */
const makeJwt = (payload: object): string => {
  const header = btoa('{"alg":"none"}')
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.sig`
}

const VALID_PAYLOAD = {
  userIndex: 'idx-1',
  userUid: 'uid-abc',
  teamUid: 'team-xyz',
  email: 'test@example.com',
  role: 'editor' as const,
  exp: 9_999_999_999,
}

const validAccessToken = makeJwt(VALID_PAYLOAD)
const validRefreshToken = makeJwt({ sub: 'refresh', exp: 9_999_999_999 })

/** A token whose `exp` is in the past (well outside the 25s buffer) */
const expiredAccessToken = makeJwt({ ...VALID_PAYLOAD, exp: 1 })
const expiredRefreshToken = makeJwt({ sub: 'refresh', exp: 1 })

describe('useAuth', () => {
  beforeEach(() => {
    // Reset module-level state and clear storage between tests
    useAuth().logout()
    localStorage.clear()
  })

  it('setTokens stores valid tokens in state and persists them to localStorage', () => {
    const { setTokens, tokenData } = useAuth()

    setTokens(validAccessToken, validRefreshToken)

    expect(tokenData.value?.email).toBe(VALID_PAYLOAD.email)
    expect(localStorage.getItem('scalar-access-token')).toBe(validAccessToken)
    expect(localStorage.getItem('scalar-refresh-token')).toBe(validRefreshToken)
  })

  it('setTokens rejects a token string with fewer than 3 dot-separated segments', () => {
    const { setTokens, tokenData } = useAuth()

    setTokens('not.a.valid.four.segment', validRefreshToken)

    expect(tokenData.value).toBeNull()
    expect(localStorage.getItem('scalar-access-token')).toBeNull()
  })

  it('setTokens rejects an access token whose payload fails schema validation', () => {
    const incomplete = makeJwt({ email: 'test@example.com' }) // missing required fields
    const { setTokens, tokenData } = useAuth()

    setTokens(incomplete, validRefreshToken)

    expect(tokenData.value).toBeNull()
  })

  it('logout clears tokens from state and removes them from localStorage', () => {
    const { setTokens, logout, tokenData, isLoggedIn } = useAuth()

    setTokens(validAccessToken, validRefreshToken)
    logout()

    expect(tokenData.value).toBeNull()
    expect(isLoggedIn.value).toBe(false)
    expect(localStorage.getItem('scalar-access-token')).toBeNull()
    expect(localStorage.getItem('scalar-refresh-token')).toBeNull()
  })

  it('isLoggedIn is true after setting valid tokens and false after logout', () => {
    const { setTokens, logout, isLoggedIn } = useAuth()

    expect(isLoggedIn.value).toBe(false)

    setTokens(validAccessToken, validRefreshToken)
    expect(isLoggedIn.value).toBe(true)

    logout()
    expect(isLoggedIn.value).toBe(false)
  })

  it('setTokens rejects when the refresh token is malformed even if the access token is valid', () => {
    const { setTokens, tokenData } = useAuth()

    setTokens(validAccessToken, 'only.two')

    // Neither token should be stored if the refresh token fails the shape check
    expect(tokenData.value).toBeNull()
    expect(localStorage.getItem('scalar-refresh-token')).toBeNull()
  })

  it('exposes the raw access token via getAccessToken', () => {
    const { setTokens, getAccessToken, logout } = useAuth()

    expect(getAccessToken()).toBeNull()

    setTokens(validAccessToken, validRefreshToken)

    expect(getAccessToken()).toBe(validAccessToken)

    logout()

    expect(getAccessToken()).toBeNull()
  })

  it('isLoggedIn remains false when the access token payload contains an empty email', () => {
    const emptyEmailPayload = { ...VALID_PAYLOAD, email: '' }
    const tokenWithEmptyEmail = makeJwt(emptyEmailPayload)
    const { setTokens, isLoggedIn } = useAuth()

    setTokens(tokenWithEmptyEmail, validRefreshToken)

    // email: '' is falsy, so isLoggedIn should not be true
    expect(isLoggedIn.value).toBe(false)
  })
})

// Tokens returned by a successful /core/login/refresh response
const refreshedAccessToken = makeJwt({ ...VALID_PAYLOAD, exp: 9_999_999_999 })
const refreshedRefreshToken = makeJwt({ sub: 'refresh', exp: 9_999_999_999 })

const mockFetch = (body: unknown, ok = true, status = 200) => {
  const spy = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('refreshTokens', () => {
  beforeEach(() => {
    useAuth().logout()
    localStorage.clear()
    vi.stubGlobal('console', { ...console, warn: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('updates tokens when the server returns a valid pair', async () => {
    const { setTokens, refreshTokens, tokenData } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    mockFetch({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
    })

    await refreshTokens()

    expect(tokenData.value?.email).toBe(VALID_PAYLOAD.email)
    expect(localStorage.getItem('scalar-access-token')).toBe(refreshedAccessToken)
    expect(localStorage.getItem('scalar-refresh-token')).toBe(refreshedRefreshToken)
  })

  it('logs out on a 401 response', async () => {
    const { setTokens, refreshTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    mockFetch({}, false, 401)

    await refreshTokens()

    expect(isLoggedIn.value).toBe(false)
    expect(localStorage.getItem('scalar-access-token')).toBeNull()
  })

  it('logs out on a 403 response', async () => {
    const { setTokens, refreshTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    mockFetch({}, false, 403)

    await refreshTokens()

    expect(isLoggedIn.value).toBe(false)
    expect(localStorage.getItem('scalar-access-token')).toBeNull()
  })

  it('leaves tokens unchanged on a non-401/403 error response', async () => {
    const { setTokens, refreshTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    mockFetch({}, false, 500)

    await refreshTokens()

    expect(isLoggedIn.value).toBe(true)
    expect(localStorage.getItem('scalar-access-token')).toBe(validAccessToken)
  })

  it('leaves tokens unchanged when the response body fails schema validation', async () => {
    const { setTokens, refreshTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    mockFetch({ accessToken: 'missing-refresh-token-field' })

    await refreshTokens()

    expect(isLoggedIn.value).toBe(true)
    expect(localStorage.getItem('scalar-access-token')).toBe(validAccessToken)
  })

  it('does not call fetch when there is no refresh token', async () => {
    const { refreshTokens } = useAuth()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await refreshTokens()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('leaves tokens unchanged on a network error', async () => {
    const { setTokens, refreshTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')))

    await refreshTokens()

    expect(isLoggedIn.value).toBe(true)
    expect(localStorage.getItem('scalar-access-token')).toBe(validAccessToken)
  })

  it('sends a POST to /core/login/refresh with the correct headers and body', async () => {
    const { setTokens, refreshTokens } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    const fetchSpy = mockFetch({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
    })

    await refreshTokens()

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.scalar.test/core/login/refresh',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: validRefreshToken }),
      }),
    )
  })
})

describe('refreshTokens single-flight dedupe', () => {
  beforeEach(() => {
    useAuth().logout()
    localStorage.clear()
    vi.stubGlobal('console', { ...console, warn: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('concurrent calls share a single in-flight fetch', async () => {
    const { setTokens, refreshTokens } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    let resolveFetch: (value: unknown) => void = () => null
    const fetchSpy = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const first = refreshTokens()
    const second = refreshTokens()
    const third = refreshTokens()

    // All three callers should resolve from a single underlying fetch
    resolveFetch({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          accessToken: refreshedAccessToken,
          refreshToken: refreshedRefreshToken,
        }),
    })

    await Promise.all([first, second, third])

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('releases the single-flight slot after the request settles', async () => {
    const { setTokens, refreshTokens } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    const fetchSpy = mockFetch({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
    })

    await refreshTokens()
    await refreshTokens()

    // A fresh call after the first settles should trigger a new fetch
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('releases the single-flight slot even when the fetch rejects', async () => {
    const { setTokens, refreshTokens } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            accessToken: refreshedAccessToken,
            refreshToken: refreshedRefreshToken,
          }),
      })
    vi.stubGlobal('fetch', fetchSpy)

    await refreshTokens()
    await refreshTokens()

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})

describe('refreshTokens with navigator.locks', () => {
  const originalLocks = (window.navigator as { locks?: unknown }).locks

  beforeEach(() => {
    useAuth().logout()
    localStorage.clear()
    vi.stubGlobal('console', { ...console, warn: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    // Restore the original locks binding after each test
    Object.defineProperty(window.navigator, 'locks', {
      value: originalLocks,
      configurable: true,
      writable: true,
    })
  })

  it('executes the refresh inside the lock callback when the lock is granted', async () => {
    const { setTokens, refreshTokens } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    const fetchSpy = mockFetch({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
    })

    const lockRequest = vi.fn(async (_name: string, _opts: object, cb: (lock: unknown) => unknown) =>
      cb({ name: 'scalar-refresh-request' }),
    )

    Object.defineProperty(window.navigator, 'locks', {
      value: { request: lockRequest },
      configurable: true,
      writable: true,
    })

    await refreshTokens()

    expect(lockRequest).toHaveBeenCalledTimes(1)
    expect(lockRequest).toHaveBeenCalledWith('scalar-refresh-request', { ifAvailable: true }, expect.any(Function))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('no-ops (does not fetch) when another tab already holds the lock', async () => {
    const { setTokens, refreshTokens } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    // ifAvailable: true hands `null` to the callback when the lock is held elsewhere
    const lockRequest = vi.fn(async (_name: string, _opts: object, cb: (lock: unknown) => unknown) => cb(null))

    Object.defineProperty(window.navigator, 'locks', {
      value: { request: lockRequest },
      configurable: true,
      writable: true,
    })

    await refreshTokens()

    expect(lockRequest).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('checkRefresh', () => {
  beforeEach(() => {
    useAuth().logout()
    localStorage.clear()
    vi.stubGlobal('console', { ...console, warn: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does nothing when there are no tokens', async () => {
    const { checkRefresh } = useAuth()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await checkRefresh()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does not refresh when the access token is still valid', async () => {
    const { setTokens, checkRefresh } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await checkRefresh()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('refreshes when the access token is expired but the refresh token is valid', async () => {
    // Seed an expired access token directly (bypasses setTokens validation)
    localStorage.setItem('scalar-access-token', expiredAccessToken)
    localStorage.setItem('scalar-refresh-token', validRefreshToken)

    // Dispatch a storage event so the in-memory refs pick up the seeded values
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'scalar-refresh-token',
        newValue: validRefreshToken,
      }),
    )

    const fetchSpy = mockFetch({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
    })

    const { checkRefresh, tokenData } = useAuth()
    await checkRefresh()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(tokenData.value?.email).toBe(VALID_PAYLOAD.email)
  })

  it('logs the user out when both access and refresh tokens are expired', async () => {
    localStorage.setItem('scalar-access-token', expiredAccessToken)
    localStorage.setItem('scalar-refresh-token', expiredRefreshToken)

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'scalar-refresh-token',
        newValue: expiredRefreshToken,
      }),
    )

    // The event handler itself logs out on an expired refresh token, so after
    // dispatch `checkRefresh` should see no tokens and return early.
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { checkRefresh, isLoggedIn } = useAuth()
    await checkRefresh()

    expect(isLoggedIn.value).toBe(false)
    expect(localStorage.getItem('scalar-access-token')).toBeNull()
    expect(localStorage.getItem('scalar-refresh-token')).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('cross-tab token sync (storage event)', () => {
  // A refresh token with an explicit future exp so isTokenExpired treats it as valid
  const freshRefreshToken = makeJwt({ sub: 'refresh', exp: 9_999_999_999 })
  const expiredToken = makeJwt({ sub: 'refresh', exp: 1 })

  const dispatchStorageEvent = (key: string, newValue: string | null) => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
  }

  beforeEach(() => {
    useAuth().logout()
    localStorage.clear()
  })

  it('syncs both tokens from localStorage when the refresh token key changes to a valid value', () => {
    const { tokenData } = useAuth()

    // Simulate another tab writing new tokens and then firing the event
    localStorage.setItem('scalar-access-token', refreshedAccessToken)
    localStorage.setItem('scalar-refresh-token', freshRefreshToken)

    dispatchStorageEvent('scalar-refresh-token', freshRefreshToken)

    expect(tokenData.value?.email).toBe(VALID_PAYLOAD.email)
    expect(localStorage.getItem('scalar-access-token')).toBe(refreshedAccessToken)
  })

  it('logs out when the refresh token key changes to null', () => {
    const { setTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    dispatchStorageEvent('scalar-refresh-token', null)

    expect(isLoggedIn.value).toBe(false)
  })

  it('logs out when the refresh token key changes to an expired token', () => {
    const { setTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    dispatchStorageEvent('scalar-refresh-token', expiredToken)

    expect(isLoggedIn.value).toBe(false)
  })

  it('ignores storage events for unrelated keys', () => {
    const { setTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    dispatchStorageEvent('some-other-key', 'irrelevant')

    expect(isLoggedIn.value).toBe(true)
  })

  it('ignores a storage event when the value is unchanged', () => {
    const { setTokens, isLoggedIn } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    dispatchStorageEvent('scalar-refresh-token', validRefreshToken)

    expect(isLoggedIn.value).toBe(true)
  })

  it('ignores storage events on the access token key', () => {
    const { setTokens, tokenData } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    // Another tab wrote a new access token without the refresh key firing yet —
    // we should NOT sync off the access key alone (relies on refresh-last ordering).
    dispatchStorageEvent('scalar-access-token', refreshedAccessToken)

    expect(tokenData.value?.email).toBe(VALID_PAYLOAD.email)
  })
})

describe('window event listeners', () => {
  beforeEach(() => {
    useAuth().logout()
    localStorage.clear()
    vi.stubGlobal('console', { ...console, warn: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('refreshes when the window receives a focus event and the access token is expired', async () => {
    localStorage.setItem('scalar-access-token', expiredAccessToken)
    localStorage.setItem('scalar-refresh-token', validRefreshToken)

    // Sync in-memory state from the seeded storage values
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'scalar-refresh-token',
        newValue: validRefreshToken,
      }),
    )

    const fetchSpy = mockFetch({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
    })

    window.dispatchEvent(new Event('focus'))

    // Allow the microtask queue to drain the async checkRefresh chain
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not refresh on focus when the access token is still valid', async () => {
    const { setTokens } = useAuth()
    setTokens(validAccessToken, validRefreshToken)

    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    window.dispatchEvent(new Event('focus'))

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('refreshes on visibilitychange when the tab becomes visible and the token is expired', async () => {
    localStorage.setItem('scalar-access-token', expiredAccessToken)
    localStorage.setItem('scalar-refresh-token', validRefreshToken)

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'scalar-refresh-token',
        newValue: validRefreshToken,
      }),
    )

    const fetchSpy = mockFetch({
      accessToken: refreshedAccessToken,
      refreshToken: refreshedRefreshToken,
    })

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not refresh on visibilitychange when the tab is hidden', async () => {
    localStorage.setItem('scalar-access-token', expiredAccessToken)
    localStorage.setItem('scalar-refresh-token', validRefreshToken)

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'scalar-refresh-token',
        newValue: validRefreshToken,
      }),
    )

    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
