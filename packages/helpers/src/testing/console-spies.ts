import { vi } from 'vitest'

/** Spy on console.warn */
export const consoleWarnSpy = vi.spyOn(console, 'warn')
export let isConsoleWarnEnabled = false

/** Spy on console.error */
export const consoleErrorSpy = vi.spyOn(console, 'error')
export let isConsoleErrorEnabled = false

/** Reset the spies */
export const resetConsoleSpies = () => {
  consoleWarnSpy.mockClear()
  consoleErrorSpy.mockClear()
}

/** Helper to re-enable console warn checks */
export const enableConsoleWarn = () => (isConsoleWarnEnabled = true)

/** Helper to disable console warn checks */
export const disableConsoleWarn = () => (isConsoleWarnEnabled = false)

/** Helper to enable console error checks */
export const enableConsoleError = () => (isConsoleErrorEnabled = true)

/** Helper to disable console error checks */
export const disableConsoleError = () => (isConsoleErrorEnabled = false)
