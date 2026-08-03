import { expect, test } from '@playwright/test'

/**
 * Signatures of the CommonJS interop failures that break the docs page under
 * pnpm (see https://github.com/scalar/scalar/issues/9440). The playground uses
 * the monorepo's hoisted node_modules, so it does not reproduce the strict-pnpm
 * layout itself, but this still guards against the errors surfacing here.
 */
const cjsInteropErrors = [/exports is not defined/, /does not provide an export named/, /require is not defined/]

test('Renders scalar/galaxy api reference from nuxt', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      pageErrors.push(message.text())
    }
  })

  await page.goto('/_scalar')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()

  const interopFailures = pageErrors.filter((error) => cjsInteropErrors.some((pattern) => pattern.test(error)))
  expect(interopFailures, `Unexpected CommonJS interop errors:\n${interopFailures.join('\n')}`).toEqual([])
})

test('Content page at /docs-reference is not hijacked by Scalar', async ({ page }) => {
  await page.goto('/docs-reference')

  await expect(page.getByRole('heading', { name: 'API Reference Documentation' })).toBeVisible()
  await expect(page.getByText('This is a content page, not the Scalar viewer.')).toBeVisible()
})

test('Content page at /docs-keys is not hijacked by Scalar', async ({ page }) => {
  await page.goto('/docs-keys')

  await expect(page.getByRole('heading', { name: 'API Keys Management' })).toBeVisible()
  await expect(page.getByText('This is a content page for managing API keys.')).toBeVisible()
})

/**
 * With multiple configurations, client-side navigation between two Scalar routes
 * used to keep showing the first document because the fetched document was
 * stored under a single shared state key (see issue #9718). Once the first
 * document was fetched, later routes reused it and never fetched their own.
 *
 * Each configuration points at its own spec URL, so watching for that request is
 * a precise signal that the document was actually fetched for the route.
 */
test('Fetches each configuration document during client-side navigation', async ({ page }) => {
  // The first navigation compiles the reference in dev mode, which can be slow
  // on CI, so give this test extra headroom.
  test.setTimeout(120_000)

  // Loading the first configuration fetches its own spec.
  const specA = page.waitForRequest((request) => request.url().includes('/spec-a.json'), { timeout: 90_000 })
  await page.goto('/scalar-a')
  await specA

  // Navigating to the second configuration must fetch its own spec, rather than
  // reusing the first document.
  const specB = page.waitForRequest((request) => request.url().includes('/spec-b.json'), { timeout: 30_000 })
  await page.getByRole('link', { name: 'Config B' }).click()
  await specB
})
