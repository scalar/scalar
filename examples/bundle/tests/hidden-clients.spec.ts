import { expect, test } from '@playwright/test'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

const HOST = process.env.HOST || 'localhost'

function createExample(configuration?: AnyApiReferenceConfiguration) {
  if (!configuration) {
    return `http://${HOST}:3000`
  }

  return `http://${HOST}:3000?SCALAR_CONFIGURATION=${JSON.stringify(configuration)}`
}

test.describe('hiddenClients', () => {
  test('default value shows all clients', async ({ page }) => {
    await page.goto(createExample())

    await expect(page.getByText('Client Libraries')).toBeVisible()

    await expect(page.getByRole('tab', { name: 'Shell', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Ruby', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Node.js', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'PHP', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Python', exact: true })).toBeVisible()

    await expect(page.getByRole('tabpanel', { name: 'Shell', exact: true })).toBeVisible()
    await expect(page.getByRole('tabpanel', { name: 'Ruby', exact: true })).not.toBeVisible()

    await expect(page.getByLabel('Create a user').getByTestId('client-picker')).toHaveText('Shell Curl')

    await page.getByRole('tab', { name: 'Ruby', exact: true }).click()

    await expect(page.getByRole('tabpanel', { name: 'Ruby', exact: true })).toBeVisible()
    await expect(page.getByRole('tabpanel', { name: 'Shell', exact: true })).not.toBeVisible()

    await expect(page.getByLabel('Create a user').getByTestId('client-picker')).toHaveText('Ruby net::http')
  })
})
