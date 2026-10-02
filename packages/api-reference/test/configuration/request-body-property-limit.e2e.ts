import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const properties = Object.fromEntries(
  Array.from({ length: 15 }, (_, index) => [
    `field${String(index + 1).padStart(2, '0')}`,
    { type: 'object', properties: { child: { type: 'string' } } },
  ]),
)
const content = {
  openapi: '3.1.0',
  info: { title: 'Request body limits', version: '1.0.0' },
  paths: {
    '/records': {
      post: {
        summary: 'Create a record',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties } } } },
        responses: { '204': { description: 'Created' } },
      },
    },
  },
}

test.describe('maxVisibleRequestBodyProperties', () => {
  for (const layout of ['modern', 'classic'] as const) {
    test(`reveals counted overflow using the keyboard in ${layout}`, async ({ page }) => {
      const example = await serveExample({ content, layout, maxVisibleRequestBodyProperties: 2 })
      await page.goto(`${example}#tag/default/POST/records`)
      const body = page.getByRole('group', { name: 'Request Body', exact: true })
      await expect(body.locator('.property-name')).toHaveCount(2)
      const reveal = body.getByRole('button', { name: /Show 13 more properties/ })
      await reveal.focus()
      await page.keyboard.press('Enter')
      await expect(body.locator('.property-name')).toHaveCount(15)
      await expect(reveal).toBeHidden()
    })

    test(`shows all top-level properties without opening nested attributes in ${layout}`, async ({ page }) => {
      const example = await serveExample({ content, layout, maxVisibleRequestBodyProperties: 0 })
      await page.goto(`${example}#tag/default/POST/records`)
      const body = page.getByRole('group', { name: 'Request Body', exact: true })
      await expect(body.locator('.property-name')).toHaveCount(15)
      await expect(body.locator('.property-name', { hasText: 'child' })).toHaveCount(0)
      await expect(body.getByRole('button', { name: /Show \d+ more propert/ })).toHaveCount(0)
    })
  }
})
