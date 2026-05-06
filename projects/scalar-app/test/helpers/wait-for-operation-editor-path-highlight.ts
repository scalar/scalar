import type { Page } from '@playwright/test'

const DEFAULT_TIMEOUT_MS = 15_000

/**
 * Waits until {@link focusPath} in the collection operation editor has applied Monaco decorations
 * (`json-focus-highlight`). The editor widget becomes visible before fold/unfold and
 * `deltaDecorations` finish, so snapshotting too early misses the path highlight.
 */
export const waitForOperationEditorPathHighlight = async (
  page: Page,
  options?: { timeout?: number },
): Promise<void> => {
  await page
    .locator('.monaco-editor .json-focus-highlight')
    .first()
    .waitFor({ state: 'visible', timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS })
}
