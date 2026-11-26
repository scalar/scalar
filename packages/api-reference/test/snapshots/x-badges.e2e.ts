import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

/**
 * Badge colors are picked by API authors, so cover light, mid-tone, dark and
 * translucent backgrounds in a few color formats. Each badge should get black
 * or white text, whichever is readable.
 */
const badges = [
  { name: 'White', color: '#ffffff' },
  { name: 'Yellow', color: '#ffcc00' },
  { name: 'Pink', color: 'pink' },
  { name: 'Green', color: 'hsl(140 60% 40%)' },
  { name: 'Red', color: 'rgb(220 38 38)' },
  { name: 'Blue', color: 'oklch(45% 0.2 260)' },
  { name: 'Black', color: 'black' },
  { name: 'Translucent', color: 'rgb(0 0 255 / 30%)' },
  { name: 'Plain' },
].map((badge) => ({ ...badge, position: 'before' }))

const content = {
  openapi: '3.1.0',
  info: { title: 'Badges', version: '1.0.0' },
  paths: {
    '/badges': {
      get: {
        summary: 'Badges',
        'x-badges': badges,
        responses: { 200: { description: 'OK' } },
      },
    },
  },
}

/** Explicit colors should read the same on any theme, so a light and a dark-leaning one is enough */
const themes = ['default', 'deepSpace'] as const
const colorModes = ['light', 'dark'] as const

test.describe('x-badges', () => {
  themes.forEach((theme) => {
    colorModes.forEach((colorMode) => {
      test(`${theme} (${colorMode})`, async ({ page }) => {
        const example = await serveExample({ content, theme, forceDarkModeState: colorMode })
        await page.goto(example)

        // All the badges sit in one row above the operation title
        const row = page.getByText('Translucent', { exact: true }).locator('..')
        await expect(row).toHaveScreenshot(`x-badges-${theme}-${colorMode}.png`)
      })
    })
  })
})
