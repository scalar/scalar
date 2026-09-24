import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const getAncestorScrollPositions = (element: Element): number[] => {
  const positions: number[] = []
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    positions.push(parent.scrollTop)
  }
  return positions
}

test.describe('response scrolling', () => {
  for (const width of [1200, 1199, 800, 390]) {
    test(`scrolls long responses inside the body at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.route('https://users.example.com/users', async (route) => {
        await route.fulfill({
          json: { users: Array.from({ length: 100 }, (_, id) => ({ id, name: `User ${id}` })) },
        })
      })
      const example = await serveExample({
        proxyUrl: '',
        content: {
          openapi: '3.1.0',
          info: { title: 'Users API', version: '1.0.0' },
          servers: [{ url: 'https://users.example.com' }],
          paths: { '/users': { get: { responses: { '200': { description: 'Users' } } } } },
        },
      })
      await page.goto(example)
      await page.getByRole('button', { name: 'Test Request' }).first().click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: /Send Request/ }).click()
      const body = dialog.getByTestId('response-body-raw')
      // This focusable viewport owns scrolling, while CodeMirror virtualizes its content.
      const scroller = body.locator(':scope > [tabindex="0"]')
      await expect(body).toContainText('User 0')
      await scroller.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('response-body.png'), animations: 'disabled' })
      await expect.poll(() => scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)

      await scroller.hover({ position: { x: 60, y: 60 } })
      const ancestors = await scroller.evaluate(getAncestorScrollPositions)
      await page.mouse.wheel(0, 200)
      await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
      expect(await scroller.evaluate(getAncestorScrollPositions)).toStrictEqual(ancestors)

      await scroller.focus()
      await page.keyboard.press('End')
      await expect(body).toContainText('User 99')
    })
  }
})
