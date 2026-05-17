import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import { loginUrl, registerUrl } from '@/helpers/auth/login-url'
import { useAuth } from '@/hooks/use-auth'

/**
 * Shared login and register click handlers for the header auth buttons
 *
 * Normally a good candiate for a helper but it touches state so must be a hook
 */
export const useAuthHandlers = ({
  eventBus,
  onAuthenticated,
}: {
  /** Workspace event bus, used to emit analytics events for auth button clicks. */
  eventBus: WorkspaceEventBus
  /** Called after a successful login or register (Electron only — web redirects to the dashboard). */
  onAuthenticated: () => void | Promise<void>
}) => {
  const { toast } = useToasts()
  const { setTokens } = useAuth()

  /**
   * Log in handler.
   * On desktop (Electron), uses the IPC exchange-token flow so the app captures
   * the auth tokens without navigating away from the Electron window.
   * On web, redirects to the dashboard login page.
   */
  const handleLogin = async (): Promise<void> => {
    eventBus.emit('log:login-click', undefined)

    if (window.electron !== true) {
      window.location.href = loginUrl()
      return
    }

    const result = await window.api.getExchangeToken('login')
    if (!result) {
      toast('Unable to login. Please try again or contact support.', 'error', {
        timeout: 10000,
      })
    } else {
      toast('Logged in successfully', 'info')
      setTokens(result.accessToken, result.refreshToken)
      await onAuthenticated?.()
    }
  }

  /**
   * Register handler.
   * On desktop (Electron), uses the same IPC exchange-token flow as login so
   * the app captures auth tokens without navigating away from the Electron window.
   * On web, redirects to the dashboard registration page.
   */
  const handleRegister = async (): Promise<void> => {
    eventBus.emit('log:register-click', undefined)

    if (window.electron !== true) {
      window.location.href = registerUrl()
      return
    }

    const result = await window.api.getExchangeToken('register')
    if (!result) {
      toast('Unable to register. Please try again or contact support.', 'error', {
        timeout: 10000,
      })
    } else {
      toast('Registered successfully', 'info')
      setTokens(result.accessToken, result.refreshToken)
      await onAuthenticated?.()
    }
  }

  return { handleLogin, handleRegister }
}
