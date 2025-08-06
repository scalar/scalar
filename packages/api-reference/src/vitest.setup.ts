import { createPluginManager } from '@/plugins/plugin-manager'
import {
  consoleErrorSpy,
  consoleWarnSpy,
  disableConsoleError,
  disableConsoleWarn,
  isConsoleErrorEnabled,
  isConsoleWarnEnabled,
  resetConsoleSpies,
} from '@scalar/helpers/testing/console-spies'
import { afterEach, expect, vi } from 'vitest'

// Mock usePluginManager
vi.mock('@/plugins/hooks/usePluginManager', () => ({
  usePluginManager: vi.fn(() => createPluginManager({})),
}))

afterEach(() => {
  /**
   * Make sure we didn't log any warnings or errors on all tests
   *
   * If you get an error that's something like "ScalarFloating: Target with id="v-0" not found", it means you need to
   * attach the component to the dom in the mount options with `attachTo: document.body`
   *
   * To disable you can call `disableConsoleChecks()` in the test
   *
   * TODO: going to disable these as a lot of our tests have warnings and errors, we can enable them globally as we
   * bring that number down
   */

  if (isConsoleWarnEnabled) {
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  }

  if (isConsoleErrorEnabled) {
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  }

  // Reset the spies
  resetConsoleSpies()
  disableConsoleWarn()
  disableConsoleError()

  vi.clearAllMocks()
})
