import { join } from 'node:path'

import { expect, test } from '@playwright/test'
import { serveHTMLExample } from '@test/utils/serve-example'

/**
 * Regression test for https://github.com/scalar/scalar/issues/5071
 *
 * The embedder selects a non-default server and then keeps pushing configuration updates
 * (for example a refreshed auth token). The user's server selection must survive those updates
 * instead of snapping back to the first server.
 *
 * The server selector renders the currently selected server URL as its trigger button, so we
 * assert on that button to know which server is active.
 */
test.describe('updateConfiguration keeps the selected server', () => {
  const fixture = join(import.meta.dirname, 'html', 'update-config-servers.html')

  /** Open the server dropdown and pick the staging server (the second, non-default one). */
  const selectStagingServer = async (page: import('@playwright/test').Page) => {
    await page.getByRole('button', { name: 'https://api.example.com' }).first().click()
    await page.getByText('https://staging.example.com').click()
    await expect(page.getByRole('button', { name: 'https://staging.example.com' }).first()).toBeVisible()
  }

  // Case A: updating only the auth token does not change the document, so it must never rebase
  // the document or reset the server. This confirms the originally reported scenario.
  test('when only the auth token changes', async ({ page }) => {
    const { url, shutdown } = await serveHTMLExample(fixture)
    await page.goto(url)

    await selectStagingServer(page)

    // Push a fresh token, exactly like the embedder in the issue does.
    await page.evaluate(() => (window as unknown as { __updateAuth: (t: string) => void }).__updateAuth('new-token'))

    // The update was actually applied (guards against this becoming a no-op)...
    await expect
      .poll(() =>
        page.evaluate(() => {
          type Config = { authentication?: { securitySchemes?: { bearerAuth?: { token?: string } } } }
          const instance = (window as unknown as { __scalar: { getConfiguration: () => Config } }).__scalar
          return instance.getConfiguration()?.authentication?.securitySchemes?.bearerAuth?.token
        }),
      )
      .toBe('new-token')

    // ...and the selected server is still staging, not back to production.
    await expect(page.getByRole('button', { name: 'https://staging.example.com' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'https://api.example.com' })).toHaveCount(0)

    shutdown()
  })

  // Case B: updating the document content rebases the document. This used to wipe the selection
  // back to the first server. We wait for the rebased content to render before asserting so we
  // check the settled state, not a transient one.
  test('when the document content changes', async ({ page }) => {
    const { url, shutdown } = await serveHTMLExample(fixture)
    await page.goto(url)

    await selectStagingServer(page)

    // Change the document (adds a `/moons` operation), which rebases it in the store.
    await page.evaluate(() => (window as unknown as { __updateContent: () => void }).__updateContent())

    // Wait for the rebased document to render (the new `/moons` tag section appears) so we assert
    // on the settled state rather than a transient one.
    await expect(page.getByRole('heading', { name: 'Moons' })).toBeVisible()

    // The selected server is still staging, not back to production.
    await expect(page.getByRole('button', { name: 'https://staging.example.com' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'https://api.example.com' })).toHaveCount(0)

    shutdown()
  })
})
