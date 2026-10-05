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

  for (const width of [1440, 1024]) {
    test(`keeps long unbroken request bodies within the modal at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const example = await serveExample({
        content: {
          openapi: '3.1.0',
          info: { title: 'Token API', version: '1.0.0' },
          paths: {
            '/tokens': {
              post: {
                requestBody: {
                  content: {
                    'application/json': { example: { token: 'A'.repeat(5000) } },
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
      await expect(body).toContainText('A'.repeat(100))
      const scroller = body.locator('..')

      // Check the containing layout as well as the editor: a locally scrolling
      // editor can still sit inside an ancestor that has grown beyond the modal.
      const fitsModal = async (): Promise<boolean> =>
        dialog.evaluate((element) => {
          const main = element.querySelector('main')
          if (!main) {
            throw new Error('Client main container is missing')
          }
          const modalBounds = element.getBoundingClientRect()
          const mainBounds = main.getBoundingClientRect()
          return main.scrollWidth <= main.clientWidth + 1 && mainBounds.right <= modalBounds.right + 1
        })
      await expect.poll(fitsModal).toBe(true)
      await expect.poll(() => scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
      expect(await scroller.evaluate((element) => getComputedStyle(element).overflowX)).toBe('auto')
      await scroller.evaluate((element) => {
        element.scrollLeft = element.scrollWidth
      })
      await expect.poll(() => scroller.evaluate((element) => element.scrollLeft > 0)).toBe(true)

      const tokenLine = body.locator('.cm-line').filter({ hasText: 'A'.repeat(100) })
      const unwrappedHeight = await tokenLine.evaluate((element) => element.getBoundingClientRect().height)
      await dialog.getByRole('button', { name: 'Wrap lines', exact: true }).click()
      await expect
        .poll(() => tokenLine.evaluate((element) => element.getBoundingClientRect().height))
        .toBeGreaterThan(unwrappedHeight)
      await expect.poll(() => scroller.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
      await expect.poll(fitsModal).toBe(true)

      await dialog.getByRole('button', { name: 'Disable line wrap', exact: true }).click()
      await expect.poll(() => scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
      await expect.poll(fitsModal).toBe(true)
    })
  }
})
