import { type Locator, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const responseDescription = 'Returns the requested items with their current names, categories, and availability.'

const content = {
  openapi: '3.1.0',
  info: { title: 'Items API', version: '1.0.0' },
  paths: {
    '/items': {
      get: {
        responses: {
          '200': {
            description: responseDescription,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string', description: 'Item name' } },
                },
              },
              'text/csv': {
                schema: { type: 'string', description: 'CSV rows' },
                example: 'name,category',
              },
            },
          },
        },
      },
    },
  },
}

/** Effective opacity also accounts for a transparent wrapper around the button. */
const getOpacity = (picker: Locator): Promise<number> =>
  picker.evaluate((button) => {
    let opacity = 1
    for (let element: Element | null = button; element; element = element.parentElement) {
      opacity *= Number(getComputedStyle(element).opacity)
    }
    return opacity
  })

for (const layout of ['modern', 'classic'] as const) {
  test.describe(layout, () => {
    test('shows the picker on a narrow collapsed response and supports keyboard selection', async ({ page }) => {
      const viewportWidth = 320
      await page.setViewportSize({ width: viewportWidth, height: 844 })
      const example = await serveExample({ content, layout })
      await page.goto(example)

      if (layout === 'classic') {
        // The Classic header actions can cover the disclosure's center at this width.
        await page.getByRole('button', { name: /^GET \/items/ }).click({ position: { x: 8, y: 8 } })
        await page.mouse.move(0, 0)
      }

      const responses = page.getByRole('list', { name: 'Responses', exact: true })
      const disclosure = responses.getByRole('button', { name: /200/ })
      const picker = responses.getByRole('button', { name: /Selected Content Type/ })
      await expect(disclosure).toHaveAttribute('aria-expanded', 'false')
      await expect(picker).toHaveText(/application\/json/)
      await expect.poll(() => getOpacity(picker)).toBe(1)

      const disclosureBox = await disclosure.boundingBox()
      const pickerBox = await picker.boundingBox()
      if (!disclosureBox || !pickerBox) {
        throw new Error('The response disclosure and media-type picker must both be rendered')
      }
      const overlap =
        Math.min(disclosureBox.x + disclosureBox.width, pickerBox.x + pickerBox.width) >
          Math.max(disclosureBox.x, pickerBox.x) &&
        Math.min(disclosureBox.y + disclosureBox.height, pickerBox.y + pickerBox.height) >
          Math.max(disclosureBox.y, pickerBox.y)
      expect(overlap).toBe(false)
      expect(pickerBox.x).toBeGreaterThanOrEqual(0)
      expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(viewportWidth)

      await disclosure.focus()
      await page.keyboard.press('Tab')
      await expect(picker).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('option', { name: 'text/csv', exact: true })).toBeVisible()
      await page.keyboard.press('End')
      await page.keyboard.press('Enter')

      await expect(picker).toHaveText(/text\/csv/)
      await expect(disclosure).toHaveAttribute('aria-expanded', 'false')
      await expect(page.locator('code').getByText('name,category', { exact: true })).toBeVisible()

      await disclosure.click()
      await expect(responses.getByText('CSV rows', { exact: true })).toBeVisible()
    })

    test('shows the picker at rest with expandAllResponses', async ({ page }) => {
      const example = await serveExample({ content, expandAllResponses: true, layout })
      await page.goto(example)

      if (layout === 'classic') {
        await page.getByRole('button', { name: /^GET \/items/ }).click()
        await page.mouse.move(0, 0)
      }

      const responses = page.getByRole('list', { name: 'Responses', exact: true })
      const picker = responses.getByRole('button', { name: /Selected Content Type/ })
      await expect(responses.getByText('Item name', { exact: true })).toBeVisible()
      await expect.poll(() => getOpacity(picker)).toBe(1)

      await picker.click()
      await page.getByRole('option', { name: 'text/csv', exact: true }).click()
      await expect(responses.getByText('CSV rows', { exact: true })).toBeVisible()
      await expect(responses.getByText('Item name', { exact: true })).toHaveCount(0)
    })
  })
}
