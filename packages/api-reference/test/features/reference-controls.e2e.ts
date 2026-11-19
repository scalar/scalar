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

/** A collapsed row whose preview is too long for the line, so it truncates against the copy-link button. */
const collapsedPreviewContent = {
  openapi: '3.1.1',
  info: { title: 'Collapsed preview', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Planet: {
        type: 'object',
        properties: {
          atmosphere: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                primaryAtmosphericCompoundName: { type: 'string' },
                percentageOfTotalAtmosphericVolume: { type: 'number' },
                measurementInstrumentIdentifier: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
}

/** An operation with both header actions: the authentication badge and the Markdown copy button. */
const securedOperationContent = {
  openapi: '3.1.1',
  info: { title: 'Secured operation', version: '1.0.0' },
  security: [{ bearerAuth: [] }],
  paths: {
    '/planets': {
      get: {
        summary: 'Get all planets',
        responses: { '200': { description: 'Planets' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' },
    },
  },
}

const unbrokenTitleContent = {
  openapi: '3.1.1',
  info: { title: 'Webhooks', version: '1.0.0' },
  webhooks: {
    'order.purchase.created': {
      post: { responses: { '200': { description: 'Delivered' } } },
    },
  },
}

/** An operation with two request body examples, so its request example footer shows the example picker. */
const requestExamplesContent = {
  openapi: '3.1.1',
  info: { title: 'Request examples', version: '1.0.0' },
  paths: {
    '/planets': {
      post: {
        summary: 'Create a planet',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } },
              examples: {
                earth: { summary: 'Earth', value: { name: 'Earth' } },
                mars: { summary: 'Mars', value: { name: 'Mars' } },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
}

const taggedContent = {
  openapi: '3.1.1',
  info: { title: 'Tagged operations', version: '1.0.0' },
  tags: [{ name: 'planets', description: 'Everything about planets' }],
  paths: {
    '/planets': {
      get: { tags: ['planets'], summary: 'List planets', responses: { '200': { description: 'OK' } } },
      post: { tags: ['planets'], summary: 'Create a planet', responses: { '201': { description: 'Created' } } },
    },
  },
}

test.describe('reference controls', () => {
  test('keeps operations list endpoint links at least 24px', async ({ page }) => {
    const example = await serveExample({ content: taggedContent })
    await page.goto(example)

    const endpoints = page.locator('.endpoints a.endpoint')
    await expect(endpoints).toHaveCount(2)
    for (const endpoint of await endpoints.all()) {
      const box = await endpoint.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(24)
    }
  })

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

    const response = page.locator('.response-card')
    const copyExample = response.getByRole('button')
    await expect(copyExample).toHaveCount(1)
    await copyExample.scrollIntoViewIfNeeded()
    // Tab away and back to exercise the browser's keyboard focus-visible state.
    await copyExample.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(copyExample).toBeFocused()
    await expect(copyExample).toHaveCSS('opacity', '1')
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

  test('lets a collapsed preview run up to the copy-link icon', async ({ page }) => {
    const example = await serveExample({ content: collapsedPreviewContent, expandAllModelSections: true })
    await page.goto(`${example}#models`)

    const copyLink = page.getByRole('button', { name: 'Copy link to atmosphere', exact: true })
    await copyLink.scrollIntoViewIfNeeded()

    const geometry = await copyLink.evaluate((button) => {
      const heading = button.parentElement!
      const preview = heading.querySelector('.property-collapsed-preview')!
      const icon = button.querySelector('svg')!
      const previewRight = preview.getBoundingClientRect().right
      return {
        truncated: preview.scrollWidth > preview.clientWidth,
        gapToIcon: icon.getBoundingClientRect().left - previewRight,
        trailingExtent: heading.getBoundingClientRect().right - previewRight,
        iconWidth: icon.getBoundingClientRect().width,
      }
    })

    // The preview fills the line, so whatever the button lays out is width the preview loses.
    expect(geometry.truncated).toBe(true)
    expect(geometry.gapToIcon).toBeCloseTo(10, 0)
    // Only the gap and the icon take room; the 24px hit box overhangs the line end.
    expect(geometry.trailingExtent).toBeCloseTo(geometry.gapToIcon + geometry.iconWidth, 0)

    const box = await copyLink.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(24)
    expect(box!.height).toBeGreaterThanOrEqual(24)

    await page.getByRole('button', { name: 'atmosphere', exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(copyLink).toBeFocused()
    await expect(copyLink).toHaveCSS('opacity', '1')
  })

  test('wraps operation header actions inside the page at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    // Longer labels than English: the badge and the copy button no longer fit on one line
    const example = await serveExample({ content: securedOperationContent, localization: { locale: 'ru' } })
    await page.goto(example)

    const copyMarkdown = page.getByRole('button', { name: 'Копировать как Markdown' })
    await expect(copyMarkdown).toBeVisible()
    const box = await copyMarkdown.boundingBox()
    expect(box!.x + box!.width).toBeLessThanOrEqual(320)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  })

  for (const width of [320, 393, 1920]) {
    test(`wraps an operation title without spaces inside the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const example = await serveExample({ content: unbrokenTitleContent })
      await page.goto(example)

      const title = page.getByRole('heading', { name: 'order.purchase.created', exact: true })
      await expect(title).toBeVisible()
      await title.scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)

      const operation = page.getByRole('region', { name: 'order.purchase.created', exact: true })
      const requestHeader = operation.locator('.request-header')
      const testRequest = operation.getByRole('button', { name: 'Test Request', exact: false })
      const headerBox = await requestHeader.boundingBox()
      const buttonBox = await testRequest.boundingBox()
      const agentBox = await operation.locator('.agent-button-container').boundingBox()
      expect(headerBox).not.toBeNull()
      expect(buttonBox).not.toBeNull()
      expect(agentBox).not.toBeNull()
      expect(agentBox!.height).toBeCloseTo(buttonBox!.height, 1)
      expect(agentBox!.y).toBeCloseTo(buttonBox!.y, 1)
      if (width < 1920) {
        expect(buttonBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height)
        const actionsBox = await operation.locator('.operation-request-actions').boundingBox()
        expect(actionsBox).not.toBeNull()
        expect(agentBox!.width).toBeCloseTo(buttonBox!.width, 0)
        expect(agentBox!.x).toBeCloseTo(actionsBox!.x, 0)
        expect(buttonBox!.x + buttonBox!.width).toBeCloseTo(actionsBox!.x + actionsBox!.width, 0)
      } else {
        expect(buttonBox!.x).toBeGreaterThanOrEqual(headerBox!.x + headerBox!.width)
        expect(buttonBox!.y).toBeLessThan(headerBox!.y + headerBox!.height)
      }
      await expect(operation.locator('.operation-request-actions')).toHaveScreenshot(`operation-actions-${width}.png`)
      await expect(page.getByRole('region', { name: 'order.purchase.created', exact: true })).toHaveScreenshot(
        `operation-title-wrap-${width}.png`,
      )
    })
  }

  for (const width of [320, 390, 1440]) {
    test(`keeps the request example name visible in the footer at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      const example = await serveExample({ content: requestExamplesContent })
      await page.goto(example)

      const card = page.locator('.request-card')
      const picker = card.getByRole('button', { name: 'Earth', exact: true })
      await picker.scrollIntoViewIfNeeded()
      await expect(picker).toBeVisible()

      // The whole name shows, and the caret stays inside the button instead of running under the actions
      const name = picker.getByText('Earth', { exact: true })
      expect(await name.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      const pickerBox = (await picker.boundingBox())!
      const caretBox = (await picker.locator('svg').boundingBox())!
      expect(caretBox.x + caretBox.width).toBeLessThanOrEqual(pickerBox.x + pickerBox.width)

      const actions = [
        card.locator('.agent-button-container'),
        card.getByRole('button', { name: 'Test Request (post /planets)', exact: true }),
      ]
      for (const action of actions) {
        const box = (await action.boundingBox())!
        // Nothing overlaps the picker: each action sits after it on the line or on a line below it
        expect(box.x >= pickerBox.x + pickerBox.width || box.y >= pickerBox.y + pickerBox.height).toBe(true)
        if (width === 320) {
          // Too narrow for both, so the actions wrap onto their own line
          expect(box.y).toBeGreaterThanOrEqual(pickerBox.y + pickerBox.height)
        }
        if (width === 1440) {
          // Wide cards keep the picker and the actions on one line
          expect(box.y).toBeCloseTo(pickerBox.y, 0)
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)

      // The picker still works from the keyboard
      await picker.focus()
      await expect(card.locator('.request-card-footer')).toHaveScreenshot(`request-example-footer-${width}.png`)
      await page.keyboard.press('ArrowDown')
      await expect(page.getByRole('option', { name: 'Mars', exact: true })).toBeVisible()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(card.getByRole('button', { name: 'Mars', exact: true })).toBeFocused()
    })
  }
})
