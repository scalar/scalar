import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('request body scrolling', () => {
  for (const wrapLines of [false, true]) {
    test(`renders and edits large JSON bodies with wrapping ${wrapLines ? 'enabled' : 'disabled'}`, async ({
      page,
    }) => {
      const example = await serveExample({
        content: {
          openapi: '3.1.0',
          info: { title: 'Items API', version: '1.0.0' },
          paths: {
            '/items': {
              post: {
                requestBody: {
                  content: {
                    'application/json': {
                      example: { items: Array.from({ length: 180 }, (_, id) => ({ id, name: `Item ${id}` })) },
                    },
                  },
                },
                responses: { '204': { description: 'Accepted' } },
              },
            },
          },
        },
      })
      await page.goto(example)
      await page.getByRole('button', { name: 'Test Request' }).click()
      const dialog = page.getByRole('dialog')
      const body = dialog.locator('.cm-content[contenteditable="true"]')
      await expect(body).toContainText('Item 0')

      if (wrapLines) {
        await dialog.getByRole('button', { name: 'Wrap lines', exact: true }).click()
      }

      // Scrolling must update the visible lines without moving the cursor to force rendering.
      await body.evaluate((element) => {
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          if (parent.scrollHeight > parent.clientHeight && /auto|scroll/.test(getComputedStyle(parent).overflowY)) {
            parent.scrollTop = parent.scrollHeight
            return
          }
        }
        throw new Error('Request body has no scrolling container')
      })
      await expect(body).toContainText('Item 179')

      const lastItem = body.locator('.cm-line').filter({ hasText: 'Item 179' })
      await expect(lastItem).toBeInViewport()
      await lastItem.click()
      await page.keyboard.press('End')
      await page.keyboard.type(' ')
      await expect(lastItem).toHaveText('      "name": "Item 179" ')
    })
  }
})
