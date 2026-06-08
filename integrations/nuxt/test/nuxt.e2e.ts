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
