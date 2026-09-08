import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Planet: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          satellite: {
            type: 'object',
            properties: {
              craterCount: { type: 'number' },
              orbit: {
                type: 'object',
                properties: {
                  radius: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  },
}

test.describe('schemaLayout', () => {
  test('defaults to the tree layout', async ({ page }) => {
    const example = await serveExample({ expandAllModelSections: true, content })

    await page.goto(`${example}#models`)

    await expect(page.locator('.property-name', { hasText: 'satellite' }).first()).toBeVisible()
    expect(await page.locator('.property--tree').count()).toBeGreaterThan(0)
    expect(await page.locator('.property-toggle').count()).toBeGreaterThan(0)
  })

  test('renders the legacy layout when asked for it', async ({ page }) => {
    const example = await serveExample({
      expandAllModelSections: true,
      schemaLayout: 'legacy',
      content,
    })

    await page.goto(`${example}#models`)

    await expect(page.locator('.property-name', { hasText: 'satellite' }).first()).toBeVisible()
    expect(await page.locator('.property--tree').count()).toBe(0)
    expect(await page.locator('.property-toggle').count()).toBe(0)
  })

  test('renders the gutter control in tree layout', async ({ page }) => {
    const example = await serveExample({
      expandAllModelSections: true,
      schemaLayout: 'tree',
      content,
    })

    await page.goto(`${example}#models`)

    const toggle = page.locator('.property-toggle').first()
    await expect(toggle).toBeVisible()

    // The control wraps no content: its name is the property name alone, and
    // the child count rides its description.
    await expect(toggle).toHaveAccessibleName('satellite')
    await expect(toggle).toHaveAccessibleDescription(/2/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('meets the two geometry facts', async ({ page }) => {
    const example = await serveExample({
      expandAllModelSections: true,
      schemaLayout: 'tree',
      content,
    })

    await page.goto(`${example}#models`)

    const toggle = page.locator('.property-toggle').first()

    // Fact one: the control's border box is at least 24px (WCAG 2.5.8).
    const box = await toggle.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(24)
    expect(box!.height).toBeGreaterThanOrEqual(24)

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')

    // Fact two: the rail hangs from the parent's text column — rail x equals
    // parent text x at every depth.
    const geometry = await page.evaluate(() => {
      const li = document.querySelector('.property-toggle')?.closest('.property--tree')
      const panel = li?.querySelector(':scope > .property-children')
      const heading = li?.querySelector(':scope > .property-heading')

      if (!li || !panel || !heading) {
        return null
      }

      return {
        railX: panel.getBoundingClientRect().left,
        // The row is a grid; the text column is wherever the heading starts.
        parentTextX: heading.getBoundingClientRect().left,
      }
    })

    expect(geometry).not.toBeNull()
    expect(Math.abs(geometry!.railX - geometry!.parentTextX)).toBeLessThan(1.5)
  })

  test('keeps a closed panel reachable by find-in-page', async ({ page }) => {
    const example = await serveExample({
      expandAllModelSections: true,
      schemaLayout: 'tree',
      content,
    })

    await page.goto(`${example}#models`)

    const toggle = page.locator('.property-toggle').first()

    // Never opened: not rendered at all — the render guard that stops
    // recursion, preserved byte for byte.
    expect(await page.locator('.property-children').count()).toBe(0)

    await toggle.click()
    await expect(page.locator('.property-name', { hasText: 'craterCount' }).first()).toBeVisible()

    await toggle.click()

    // Opened once and closed: kept in the DOM under hidden="until-found".
    const panel = page.locator('.property-children').first()
    await expect(panel).toHaveAttribute('hidden', 'until-found')
    await expect(page.locator('.property-name', { hasText: 'craterCount' })).not.toBeVisible()
  })

  test('expands a subtree opened through a collapsed row again after reload', async ({ page }) => {
    const example = await serveExample({
      expandAllModelSections: true,
      schemaLayout: 'tree',
      content,
    })

    await page.goto(`${example}#models`)

    // Expansion state must survive toggling other rows: open satellite, then
    // orbit inside it, close satellite, reopen — orbit stays open.
    await page.locator('.property-toggle').first().click()
    await expect(page.locator('.property-name', { hasText: 'orbit' }).first()).toBeVisible()

    // `has:` matches ancestors too (orbit's name is inside satellite's row), so
    // scope to the row that owns the name directly and take its own toggle.
    const orbitToggle = page
      .locator('.property--tree', {
        has: page.locator(':scope > .property-heading .property-name', {
          hasText: 'orbit',
        }),
      })
      .locator(':scope > .property-toggle')
    await orbitToggle.click()
    await expect(page.locator('.property-name', { hasText: 'radius' }).first()).toBeVisible()

    const satelliteToggle = page.locator('.property-toggle[aria-expanded]').first()
    await satelliteToggle.click()
    await expect(page.locator('.property-name', { hasText: 'radius' })).not.toBeVisible()

    await satelliteToggle.click()
    await expect(page.locator('.property-name', { hasText: 'radius' }).first()).toBeVisible()
  })
})
