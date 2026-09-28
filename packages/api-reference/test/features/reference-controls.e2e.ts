import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Reference control accessibility', version: '1.0.0' },
  paths: {
    '/planets': {
      get: {
        summary: 'Get authenticated user',
        responses: {
          '200': {
            description: 'A planet',
            content: {
              'application/json': {
                schema: { type: 'string' },
                example: 'Earth',
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Planet: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          satellite: {
            type: 'object',
            properties: { radius: { type: 'number' } },
          },
        },
      },
    },
  },
}

test.describe('reference controls', () => {
  for (const width of [1440, 320]) {
    test(`keeps schema controls at least 24px at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const example = await serveExample({ content, expandAllModelSections: true })
      await page.goto(`${example}#models`)

      const toggle = page.getByRole('button', { name: 'satellite', exact: true })
      const copyLink = page.getByRole('button', { name: 'Copy link to name', exact: true })

      for (const control of [toggle, copyLink]) {
        await control.scrollIntoViewIfNeeded()
        const box = await control.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.width).toBeGreaterThanOrEqual(24)
        expect(box!.height).toBeGreaterThanOrEqual(24)
      }

      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByText('radius', { exact: true })).toBeVisible()
    })
  }

  test('shows the response copy button focus ring for keyboard navigation', async ({ page }) => {
    const example = await serveExample({ content })
    await page.goto(example)

    const copyExample = page.getByRole('button', { name: 'Copy example value', exact: true })
    await copyExample.scrollIntoViewIfNeeded()
    // Tab away and back to exercise the browser's keyboard focus-visible state.
    await copyExample.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(copyExample).toBeFocused()
    expect(await copyExample.evaluate((element) => element.matches(':focus-visible'))).toBe(true)
    const outline = await copyExample.evaluate((element) => {
      const style = getComputedStyle(element)
      return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth), color: style.outlineColor }
    })
    expect(outline.style).not.toBe('none')
    expect(outline.width).toBeGreaterThan(0)
    expect(outline.color).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('keeps heading copy buttons inside the page at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    const example = await serveExample({ content, expandAllModelSections: true })
    await page.goto(example)

    const headingLinks = page.getByRole('button', { name: 'Copy link', exact: true })
    await expect(headingLinks.first()).toBeAttached()
    for (const copyLink of await headingLinks.all()) {
      await copyLink.focus()
      const box = await copyLink.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x + box!.width).toBeLessThanOrEqual(320)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  })
})
