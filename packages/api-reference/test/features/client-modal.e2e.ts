import { stat } from 'node:fs/promises'

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

    // Initial focus lands on the close button so the way out of the dialog is announced first.
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Close Client' })).toBeFocused()

    // Activating it from the initial focus closes the dialog and returns focus to the opener.
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Test Request' }).first()).toBeFocused()
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

    // Blurring must keep the full URL. A webhook destination is not split into a
    // server plus a path, so the value must not collapse to a stray "/".
    await destination.blur()
    await expect(destination).toHaveText('https://hooks.example.com/deliveries')
  })

  test('highlights and downloads an empty attachment from the keyboard', async ({ page }, testInfo) => {
    const example = await serveExample({
      proxyUrl: '',
      content: {
        openapi: '3.1.1',
        info: { title: 'Attachment API', version: '1.0.0' },
        servers: [{ url: '/' }],
        paths: { '/export': { get: { responses: { '200': { description: 'CSV export' } } } } },
      },
    })
    await page.route(`${example}/export`, (route) =>
      route.fulfill({
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="export.csv"' },
        body: '',
      }),
    )

    await page.goto(example)
    const opener = page.getByRole('button', { name: 'Test Request (get /export)', exact: true })
    await opener.click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Send Request' }).click()

    const response = dialog.getByRole('region', { name: 'Response', exact: true })
    const download = response.getByRole('link', { name: 'Download Response Body', exact: true })
    await expect(download).toBeVisible()
    const restingBackground = await download.evaluate((link) => getComputedStyle(link).backgroundColor)
    await download.hover()
    const hoveredBackground = await download.evaluate((link) => getComputedStyle(link).backgroundColor)
    expect(hoveredBackground).not.toBe(restingBackground)

    const bodyTab = response.getByRole('button', { name: 'Body', exact: true })
    await bodyTab.hover()
    await bodyTab.focus()
    await page.keyboard.press('Tab')
    await expect(download).toBeFocused()
    await expect(download).toHaveCSS('background-color', hoveredBackground)

    const [file] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')])
    expect(file.suggestedFilename()).toBe('export.csv')
    const savedPath = testInfo.outputPath('export.csv')
    await file.saveAs(savedPath)
    expect((await stat(savedPath)).size).toBe(0)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })
})
