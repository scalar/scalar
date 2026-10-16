import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const LONG_PATH = '/organizations/{organizationId}/warehouses/{warehouseId}/inventory/{itemId}/movements'

const content = {
  openapi: '3.1.1',
  info: { title: 'Long path', version: '1.0.0' },
  paths: {
    [LONG_PATH]: {
      get: {
        summary: 'List inventory movements',
        responses: { '200': { description: 'Movements' } },
      },
    },
  },
}

test.describe('request example header', () => {
  test('wraps a long path instead of cutting it off at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    const example = await serveExample({ content })
    await page.goto(example)

    const path = page.locator('.request-card .operation-path')
    await expect(path).toHaveText(LONG_PATH)
    const clipped = await path.evaluate((element) => {
      const title = element.closest('.scalar-card-header-title')!
      return title.scrollWidth > title.clientWidth
    })
    expect(clipped).toBe(false)
  })
})
