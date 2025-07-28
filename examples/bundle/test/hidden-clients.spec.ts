import { expect, test } from '@playwright/test'
import { createExample } from './utils/create-example'

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

  test('empty array shows all clients', async ({ page }) => {
    await page.goto(createExample({ hiddenClients: [] }))

    await expect(page.getByText('Client Libraries')).toBeVisible()

    // Should show all major client categories
    await expect(page.getByRole('tab', { name: 'Shell', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Ruby', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Node.js', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'PHP', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Python', exact: true })).toBeVisible()
  })

  test('hides specific clients across all categories', async ({ page }) => {
    await page.goto(createExample({ hiddenClients: ['fetch', 'axios'] }))

    await expect(page.getByText('Client Libraries')).toBeVisible()

    // Should still show the client categories
    await expect(page.getByRole('tab', { name: 'Shell', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Ruby', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Node.js', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'PHP', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Python', exact: true })).toBeVisible()

    // Shows all clients but not axios and fetch
    await page.getByLabel('Create a user').getByTestId('client-picker').click()

    // Visible
    await expect(page.getByRole('listbox').getByRole('option', { name: 'Curl', exact: true })).toHaveCount(1)
    await expect(page.getByRole('listbox').getByRole('option', { name: 'undici', exact: true })).toHaveCount(1)
    await expect(page.getByRole('listbox').getByRole('option', { name: 'ofetch', exact: true })).toHaveCount(2)
    await expect(page.getByRole('listbox').getByRole('option', { name: 'XHR', exact: true })).toHaveCount(1)

    // Not visible
    await expect(page.getByRole('listbox').getByRole('option', { name: 'Fetch', exact: true })).toHaveCount(0)
    await expect(page.getByRole('listbox').getByRole('option', { name: 'Axios', exact: true })).toHaveCount(0)
  })

  test('hides entire categories when set to true', async ({ page }) => {
    await page.goto(
      createExample({
        hiddenClients: {
          python: true,
        },
      }),
    )

    await expect(page.getByText('Client Libraries')).toBeVisible()

    // Other categories should still be visible
    await expect(page.getByRole('tab', { name: 'Shell', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Ruby', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Node.js', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'PHP', exact: true })).toBeVisible()

    // Python should be hidden
    await expect(page.getByRole('tab', { name: 'Python', exact: true })).not.toBeVisible()
  })

  test('hides specific clients within categories', async ({ page }) => {
    await page.goto(
      createExample({
        hiddenClients: {
          node: ['fetch', 'axios'],
          js: ['jquery'],
        },
      }),
    )

    await expect(page.getByText('Client Libraries')).toBeVisible()

    await page.getByLabel('Create a user').getByTestId('client-picker').click()

    // Should have all clients but jQuery and fetch and axios
    await expect(page.getByRole('option', { name: 'ofetch', exact: true })).toHaveCount(2)
    await expect(page.getByRole('option', { name: 'XHR', exact: true })).toHaveCount(1)

    // Not visible
    await expect(page.getByRole('option', { name: 'fetch', exact: true })).toHaveCount(0)
    await expect(page.getByRole('option', { name: 'axios', exact: true })).toHaveCount(0)
    await expect(page.getByRole('option', { name: 'jQuery', exact: true })).toHaveCount(0)
  })

  test('handles mixed boolean and array values', async ({ page }) => {
    await page.goto(
      createExample({
        hiddenClients: {
          python: true, // Hide entire python category
          csharp: ['restsharp'], // Hide only native from ruby
        },
      }),
    )

    await expect(page.getByText('Client Libraries')).toBeVisible()

    // Tabs
    await expect(page.getByRole('tab', { name: 'Shell', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Ruby', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Node.js', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'PHP', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Python', exact: true })).not.toBeVisible()

    // Open dropdown
    await page.getByLabel('Create a user').getByTestId('client-picker').click()

    // XHR should be visible
    await expect(page.getByRole('listbox').getByRole('option', { name: 'XHR', exact: true })).toHaveCount(1)

    // C# should have HttpClient but not have RestSharp
    await expect(page.getByRole('listbox').getByRole('option', { name: 'HttpClient', exact: true })).toHaveCount(1)
    await expect(page.getByRole('listbox').getByRole('option', { name: 'RestSharp', exact: true })).toHaveCount(0)
  })

  test('hides all clients when set to true', async ({ page }) => {
    await page.goto(createExample({ hiddenClients: true }))

    // Client Libraries section should not be visible at all
    await expect(page.getByText('Client Libraries')).not.toBeVisible()
  })

  test('handles non-existent names gracefully', async ({ page }) => {
    await page.goto(
      createExample({
        hiddenClients: {
          nonexistent: true,
          alsoNonexistent: ['fetch'],
          js: ['does-not-exist'],
        },
      }),
    )

    await expect(page.getByText('Client Libraries')).toBeVisible()

    // Should still show all client categories since non-existent categories don't affect anything
    await expect(page.getByRole('tab', { name: 'Shell', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Ruby', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Node.js', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'PHP', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Python', exact: true })).toBeVisible()
  })
})
