import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('modelsSectionLabel', () => {
  test('shows Schemas heading when set to Schemas', async ({ page }) => {
    const example = await serveExample({ modelsSectionLabel: 'Schemas' })

    await page.goto(`${example}#schemas`)

    await expect(page.getByRole('heading', { name: 'Schemas', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Models', level: 2 })).not.toBeVisible()
  })

  test('shows Models heading by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(`${example}#models`)

    await expect(page.getByRole('heading', { name: 'Models', level: 2 })).toBeVisible()
  })

  test('redirects legacy /model/ deep links to the streamlined slug', async ({ page }) => {
    const example = await serveExample()

    // Pre-streamline URLs used `/model/<name>` (singular). Bookmarks should still resolve.
    await page.goto(`${example}#scalar-galaxy/model/Planet`)

    await expect(page).toHaveURL(/#scalar-galaxy\/models\/Planet$/)
  })

  test('uses a custom label across heading and sidebar', async ({ page }) => {
    const example = await serveExample({ modelsSectionLabel: 'Data Types' })

    await page.goto(`${example}#data-types`)

    // Section heading reflects the custom label
    await expect(page.getByRole('heading', { name: 'Data Types', level: 2 })).toBeVisible()

    // Sidebar shows the custom label, not the default
    await expect(page.getByRole('navigation').getByText('Data Types', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('navigation').getByText('Models', { exact: true })).toHaveCount(0)

    // Per-model URL slug derivation is covered by get-navigation-options.test.ts.
  })
})
