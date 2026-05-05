import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthHandlers } from './use-auth-handlers'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockToast = vi.fn()
vi.mock('@scalar/use-toasts', () => ({
  useToasts: () => ({ toast: mockToast }),
}))

const mockSetTokens = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ setTokens: mockSetTokens }),
}))

vi.mock('@/helpers/auth/login-url', () => ({
  loginUrl: () => 'https://dashboard.test/login',
  registerUrl: () => 'https://dashboard.test/register',
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stub window.location so we can assert href assignments without jsdom navigation. */
const stubLocation = () => {
  const location = { href: '' }
  vi.stubGlobal('location', location)
  return location
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuthHandlers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    mockToast.mockClear()
    mockSetTokens.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('handleLogin', () => {
    describe('web (non-desktop)', () => {
      it('redirects to the login URL when not running in Electron', async () => {
        vi.stubGlobal('electron', false)
        const location = stubLocation()

        const { handleLogin } = useAuthHandlers()
        await handleLogin()

        expect(location.href).toBe('https://dashboard.test/login')
      })

      it('does not call getExchangeToken on web', async () => {
        vi.stubGlobal('electron', false)
        stubLocation()

        const getExchangeToken = vi.fn()
        vi.stubGlobal('api', { getExchangeToken })

        const { handleLogin } = useAuthHandlers()
        await handleLogin()

        expect(getExchangeToken).not.toHaveBeenCalled()
      })
    })

    describe('desktop (Electron)', () => {
      beforeEach(() => {
        vi.stubGlobal('electron', true)
        stubLocation()
      })

      it('calls getExchangeToken with flow=login via the IPC bridge', async () => {
        const getExchangeToken = vi.fn().mockResolvedValue(null)
        vi.stubGlobal('api', { getExchangeToken })

        const { handleLogin } = useAuthHandlers()
        await handleLogin()

        expect(getExchangeToken).toHaveBeenCalledWith('login')
      })

      it('stores tokens and shows a success toast when exchange succeeds', async () => {
        const tokens = { accessToken: 'access.tok', refreshToken: 'refresh.tok' }
        vi.stubGlobal('api', { getExchangeToken: vi.fn().mockResolvedValue(tokens) })

        const { handleLogin } = useAuthHandlers()
        await handleLogin()

        expect(mockSetTokens).toHaveBeenCalledWith(tokens.accessToken, tokens.refreshToken)
        expect(mockToast).toHaveBeenCalledWith('Logged in successfully', 'info')
      })

      it('shows an error toast and does not store tokens when exchange returns null', async () => {
        vi.stubGlobal('api', { getExchangeToken: vi.fn().mockResolvedValue(null) })

        const { handleLogin } = useAuthHandlers()
        await handleLogin()

        expect(mockSetTokens).not.toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith('Unable to login. Please try again or contact support.', 'error', {
          timeout: 10000,
        })
      })

      it('does not redirect window.location on desktop', async () => {
        const location = stubLocation()
        vi.stubGlobal('api', { getExchangeToken: vi.fn().mockResolvedValue(null) })

        const { handleLogin } = useAuthHandlers()
        await handleLogin()

        expect(location.href).toBe('')
      })
    })
  })

  describe('handleRegister', () => {
    describe('web (non-desktop)', () => {
      it('redirects to the register URL', async () => {
        vi.stubGlobal('electron', false)
        const location = stubLocation()

        const { handleRegister } = useAuthHandlers()
        await handleRegister()

        expect(location.href).toBe('https://dashboard.test/register')
      })

      it('does not call getExchangeToken on web', async () => {
        vi.stubGlobal('electron', false)
        stubLocation()

        const getExchangeToken = vi.fn()
        vi.stubGlobal('api', { getExchangeToken })

        const { handleRegister } = useAuthHandlers()
        await handleRegister()

        expect(getExchangeToken).not.toHaveBeenCalled()
      })
    })

    describe('desktop (Electron)', () => {
      beforeEach(() => {
        vi.stubGlobal('electron', true)
        stubLocation()
      })

      it('calls getExchangeToken with flow=register via the IPC bridge', async () => {
        const getExchangeToken = vi.fn().mockResolvedValue(null)
        vi.stubGlobal('api', { getExchangeToken })

        const { handleRegister } = useAuthHandlers()
        await handleRegister()

        expect(getExchangeToken).toHaveBeenCalledWith('register')
      })

      it('stores tokens and shows a success toast when exchange succeeds', async () => {
        const tokens = { accessToken: 'access.tok', refreshToken: 'refresh.tok' }
        vi.stubGlobal('api', { getExchangeToken: vi.fn().mockResolvedValue(tokens) })

        const { handleRegister } = useAuthHandlers()
        await handleRegister()

        expect(mockSetTokens).toHaveBeenCalledWith(tokens.accessToken, tokens.refreshToken)
        expect(mockToast).toHaveBeenCalledWith('Registered successfully', 'info')
      })

      it('shows an error toast and does not store tokens when exchange returns null', async () => {
        vi.stubGlobal('api', { getExchangeToken: vi.fn().mockResolvedValue(null) })

        const { handleRegister } = useAuthHandlers()
        await handleRegister()

        expect(mockSetTokens).not.toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith('Unable to register. Please try again or contact support.', 'error', {
          timeout: 10000,
        })
      })

      it('does not redirect window.location on desktop', async () => {
        const location = stubLocation()
        vi.stubGlobal('api', { getExchangeToken: vi.fn().mockResolvedValue(null) })

        const { handleRegister } = useAuthHandlers()
        await handleRegister()

        expect(location.href).toBe('')
      })
    })
  })
})
