import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('client modal', () => {
  /**
   * Unit test:
   * - packages/api-client/src/v2/components/modals/ModalClientContainer.spec.ts
   * - 'activates focus trap and emits open'
   *
   * @see https://github.com/scalar/scalar/pull/8072#pullrequestreview-3783424790
   */
  test('opens the client modal when clicked and set focus properly', async ({ page }) => {
    const example = await serveExample({
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/endpoint': {
            get: {
              summary: 'Get endpoint',
            },
          },
        },
      },
    })

    await page.goto(example)

    await page.getByRole('button', { name: 'Test Request' }).first().click()

    await expect(page.getByRole('dialog')).toBeVisible()

    await expect(page.getByRole('dialog').getByRole('button', { name: 'Show Sidebar' })).toBeFocused()
  })

  test('opens a webhook with an editable request destination', async ({ page }) => {
    const example = await serveExample({
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Webhook API',
          version: '1.0.0',
        },
        paths: {},
        webhooks: {
          'delivery.created': {
            post: {
              summary: 'Receive a delivery',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        deliveryId: { type: 'string' },
                      },
                    },
                  },
                },
              },
              responses: {
                '204': { description: 'Accepted' },
              },
            },
          },
        },
      },
    })

    await page.goto(example)
    await page.getByRole('button', { name: 'Test Request' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const destination = dialog.locator('[aria-label="Path"]').getByRole('textbox')
    await expect(destination).toBeEditable()
    await destination.fill('https://hooks.example.com/deliveries')
    await expect(destination).toHaveText('https://hooks.example.com/deliveries')
  })
})
