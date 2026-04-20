import { expect, test } from '@playwright/test'
import { themeIds } from '@scalar/themes'
import { serveExample } from '@test/utils/serve-example'

/** Capitalize the first letter of value in a template string */
const caps = (strings: TemplateStringsArray, ...values: string[]): string =>
  String.raw({ raw: strings }, ...values.map((v) => v.charAt(0).toUpperCase() + v.slice(1)))

/** Simple document to test the themes */
const content = (title: string = 'Hello World') => ({
  openapi: '3.0.0',
  info: { title, version: '1.0.0' },
  paths: {
    '/path': {
      get: { summary: 'Endpoint', responses: { 200: { description: 'OK' } } },
    },
  },
})
const layouts = ['classic', 'modern'] as const
const colorModes = ['light', 'dark'] as const

/**
 * Takes snapshots of the different themes
 */

layouts.forEach((layout) => {
  themeIds.forEach((theme) => {
    test.describe(caps`${theme}`, () => {
      colorModes.forEach((colorMode) => {
        test(caps`${layout} (${colorMode})`, async ({ page }) => {
          const example = await serveExample({
            content: content(caps`${theme} ${layout} (${colorMode})`),
            layout,
            theme,
            forceDarkModeState: colorMode,
          })
          await page.goto(example)

          await expect(page).toHaveScreenshot(`${theme}-${layout}-${colorMode}.png`)
        })
      })
    })
  })
})
