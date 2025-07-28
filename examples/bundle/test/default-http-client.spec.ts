import { expect, test } from '@playwright/test'
import { createExample } from './utils/create-example'

test.describe('defaultHttpClient', () => {
  test('default value is shell/curl', async ({ page }) => {
    await page.goto(createExample())

    await expect(page.getByText('Client Libraries')).toBeVisible()

    await expect(page.getByRole('tab', { name: 'Shell', exact: true })).toBeVisible()

    await expect(page.getByRole('tabpanel', { name: 'Shell', exact: true })).toBeVisible()
    await expect(page.getByRole('tabpanel', { name: 'Node.js', exact: true })).not.toBeVisible()

    await expect(page.getByLabel('Create a user').getByTestId('client-picker')).toHaveText('Shell Curl')
  })

  test('can be set to node/undici', async ({ page }) => {
    await page.goto(
      createExample({
        defaultHttpClient: {
          targetKey: 'node',
          clientKey: 'undici',
        },
      }),
    )

    await expect(page.getByText('Client Libraries')).toBeVisible()

    await expect(page.getByRole('tab', { name: 'Node.js', exact: true })).toBeVisible()

    await expect(page.getByRole('tabpanel', { name: 'Shell', exact: true })).not.toBeVisible()
    await expect(page.getByRole('tabpanel', { name: 'Node.js', exact: true })).toBeVisible()

    await expect(page.getByLabel('Create a user').getByTestId('client-picker')).toHaveText('Node.js undici')
  })
})
