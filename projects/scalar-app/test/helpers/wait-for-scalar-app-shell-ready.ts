/// <reference path="../../src/vite-env.d.ts" />

import type { Page } from '@playwright/test'

const DEFAULT_TIMEOUT_MS = 60_000

/**
 * Waits until {@link App.vue} main `v-if` conditions are satisfied: splash is gone, workspace shell is
 * mounted, and `initializeAppEventHandlers` / router views can handle navigation.
 */
export const waitForScalarAppShellReady = async (page: Page, options?: { timeout?: number }): Promise<void> => {
  await page.waitForFunction(
    () => {
      const dump = window.dumpAppState
      if (typeof dump !== 'function') {
        return false
      }
      const app = dump()
      return app.store.value !== null && app.workspace.activeWorkspace.value !== null && !app.loading.value
    },
    { timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS },
  )
}
