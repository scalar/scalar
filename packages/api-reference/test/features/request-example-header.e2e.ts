import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const LONG_PATH = '/organizations/{organizationId}/warehouses/{warehouseId}/inventory/{itemId}/movements'
const SHORT_PATH = '/planets'

/** Minimal document with a single GET operation on the given path */
const createContent = (path: string) => ({
  openapi: '3.1.1',
  info: { title: 'Request example header', version: '1.0.0' },
  paths: {
    [path]: {
      get: {
        summary: 'List items',
        responses: { '200': { description: 'Items' } },
      },
    },
  },
})

/** Vertical offset between the path and the client picker in the request example header */
const getPickerOffset = async (page: Page): Promise<number> => {
  const path = await page.locator('.request-card .operation-path').boundingBox()
  const picker = await page.locator('.request-card [data-testid="client-picker"]').boundingBox()
  return (picker?.y ?? 0) - (path?.y ?? 0)
}

test.describe('request example header', () => {
  test('wraps a long path instead of cutting it off at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    const example = await serveExample({ content: createContent(LONG_PATH) })
    await page.goto(example)

    const path = page.locator('.request-card .operation-path')
    await expect(path).toHaveText(LONG_PATH)
    const clipped = await path.evaluate((element) => {
      const title = element.closest('.scalar-card-header-title')!
      return title.scrollWidth > title.clientWidth
    })
    expect(clipped).toBe(false)
  })

  test('moves the client picker below a long path', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    const example = await serveExample({ content: createContent(LONG_PATH) })
    await page.goto(example)

    const path = page.locator('.request-card .operation-path')
    await expect(path).toHaveText(LONG_PATH)
    const pathBox = await path.boundingBox()

    expect(await getPickerOffset(page)).toBeGreaterThanOrEqual(pathBox?.height ?? 0)
  })

  test('keeps the client picker beside a short path', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const example = await serveExample({ content: createContent(SHORT_PATH) })
    await page.goto(example)

    await expect(page.locator('.request-card .operation-path')).toHaveText(SHORT_PATH)

    // Same row, give or take the difference in line height
    expect(Math.abs(await getPickerOffset(page))).toBeLessThan(10)
  })
})
