import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test('opens and closes an operation by clicking its caret', async ({ page }) => {
  const example = await serveExample({
    layout: 'classic',
    content: {
      openapi: '3.1.2',
      info: { title: 'Accordion interactions', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
            responses: { '200': { description: 'A list of pets' } },
          },
        },
      },
    },
  })

  await page.goto(example)

  const accordion = page.locator('.section-accordion').filter({ hasText: 'List pets' }).first()
  const toggle = accordion.locator('.section-accordion-button')
  const caret = accordion.locator('.section-accordion-chevron')

  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  // Click the coordinates a user sees, including when the rotated icon paints above the toggle.
  for (const expanded of ['true', 'false']) {
    const bounds = await caret.boundingBox()
    if (!bounds) {
      throw new Error('The operation caret is not visible')
    }
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    await expect(toggle).toHaveAttribute('aria-expanded', expanded)
  }
})
