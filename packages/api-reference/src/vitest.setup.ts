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

import { createPluginManager } from '@/plugins/plugin-manager'

// Mock usePluginManager
vi.mock('@/plugins/hooks/usePluginManager', () => ({
  usePluginManager: vi.fn(() => createPluginManager({})),
}))

/**
 * Tests run unattended, so they report themselves as automated, as the Playwright suites do. The API
 * Hosting beta popup never opens then; otherwise it would open partway through any test that mounts
 * the reference on jsdom's localhost. jsdom does not define the flag itself.
 */
Object.defineProperty(navigator, 'webdriver', { configurable: true, get: () => true })

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
