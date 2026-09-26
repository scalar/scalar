import {
  type BrowserContext,
  type BrowserContextOptions,
  type Locator,
  test as base,
  expect,
  devices as playwrightDevices,
} from '@playwright/test'
import { defaultThemeVariant } from '@scalar/helpers/storybook/themes'

import {
  type ComponentTestOptions,
  type SnapshotFn,
  componentDetailsFromContext,
  devices,
  setColorMode,
  snapshotFilename,
  transparentCssPath,
} from './shared'

export { expect }

export type { Device } from './shared'

/**
 * Visual test helpers.
 *
 * Stories are rendered by the gallery in `./gallery` through Playwright's built-in `mount()`
 * fixture. Storybook remains the browsable workbench, but it is no longer in the test path, so the
 * suite no longer depends on its preview URL shape, its error markup or its root element.
 *
 * @see ./gallery/main.ts for the other half of the contract.
 */

export type TestBody = Parameters<typeof test>[2]

type ComponentTestFixtures = {
  /**
   * The mounted story, as a locator pointing at the gallery's root element.
   *
   * Mounting is automatic so a test body can go straight to interacting or snapshotting.
   */
  mountedStory: Locator
  /** Helper to take a snapshot with a normalized filename and optional suffix. */
  snapshot: SnapshotFn
}

export const test = base.extend<ComponentTestOptions & ComponentTestFixtures>({
  // Options (can be overridden per test via test.use)
  component: [undefined, { option: true }],
  story: [undefined, { option: true }],
  args: [undefined, { option: true }],
  background: [false, { option: true }],
  crop: ['body', { option: true }],
  scale: [2, { option: true }],
  maxDiffPixels: [undefined, { option: true }],
  device: [undefined, { option: true }],
  colorModes: [['light'], { option: true }],
  theme: [defaultThemeVariant, { option: true }],

  // Ensure the deviceScaleFactor option is applied by creating a context with scale
  context: async ({ browser, contextOptions, viewport, scale, device }, use, testInfo) => {
    const deviceConfig = device ? playwrightDevices[devices[device]] : {}
    const options: BrowserContextOptions = {
      ...contextOptions,
      ...deviceConfig,
      viewport,
      deviceScaleFactor: scale,
    }
    const context: BrowserContext = await browser.newContext(options)

    // Add an annotation with the scale factor
    testInfo.annotations.push({ type: 'device scale', description: `${scale}x` })

    await use(context)
    await context.close()
  },

  /**
   * Hands the theme to the gallery.
   *
   * `mount()` navigates to the bare base URL, so there is no query string to carry a theme. An init
   * script runs before any page script on every navigation, which puts the theme in place early
   * enough for the gallery to apply it on the first paint rather than as a flash after the story
   * renders.
   */
  page: async ({ page, theme }, use) => {
    await page.addInitScript((value) => {
      window.__scalarTheme = value
    }, theme)

    await use(page)
  },

  // Render the story before the test body runs
  mountedStory: [
    async ({ mount, component: c, story: s, args }, use, testInfo) => {
      const { component, story } = componentDetailsFromContext(c, s, testInfo)

      await use(await mount(`${component}/${story}`, args))
    },
    { auto: true },
  ],

  // Snapshot helper bound to current test settings
  snapshot: async (
    { page, mountedStory, background, crop, colorModes, theme, maxDiffPixels, component: c, story: s },
    use,
    testInfo,
  ) => {
    const takeSnapshot: SnapshotFn = async (suffix?: string): Promise<void> => {
      const { story } = componentDetailsFromContext(c, s, testInfo)

      // The mount locator is the gallery root, so its child is the component itself
      const target =
        crop === 'viewport' ? page : crop === 'component' ? mountedStory.locator('> *') : page.locator('body')

      for (const colorMode of colorModes) {
        await setColorMode(page, colorMode)
        await expect(target).toHaveScreenshot(snapshotFilename({ story, suffix, theme, colorMode }), {
          omitBackground: !background,
          stylePath: background ? undefined : transparentCssPath,
          // Spread so an unset option falls through to the project wide ratio
          ...(maxDiffPixels === undefined ? {} : { maxDiffPixels }),
        })
      }
    }

    await use(takeSnapshot)
  },
})

/**
 * Helper to just take a snapshot of a story
 */
export const takeSnapshot: TestBody = async ({ snapshot }) => await snapshot()

const clamp = (value: number): number => Math.min(1, Math.max(0, value))

const linearChannel = (channel: number): number =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

/**
 * Converts display-p3 channels to linear sRGB, the way a browser projects a wide-gamut color onto an
 * ordinary monitor (through XYZ, then clipped per channel).
 */
const displayP3ToLinearSrgb = ([r, g, b]: [number, number, number]): [number, number, number] => {
  const [lr, lg, lb] = [linearChannel(r), linearChannel(g), linearChannel(b)]
  const x = 0.4865709 * lr + 0.2656677 * lg + 0.1982173 * lb
  const y = 0.2289746 * lr + 0.6917385 * lg + 0.0792869 * lb
  const z = 0.0451134 * lg + 1.0439444 * lb
  return [
    clamp(3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    clamp(-0.969266 * x + 1.8760108 * y + 0.041556 * z),
    clamp(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
  ]
}

/**
 * Parses a computed CSS color into linear sRGB channels in the 0-1 range.
 *
 * The themes declare their accents in `display-p3` where the browser supports it, and Chromium
 * reports a `color-mix()` of such a token as `color(srgb r g b)` with channels that can sit outside
 * 0-1. Both are clipped the way a display clips them. Everything else comes back as `rgb()` /
 * `rgba()`.
 */
const parseComputedColor = (value: string): [number, number, number] => {
  const numbers = value.match(/-?\d*\.?\d+/g)?.map(Number) ?? []

  if (value.startsWith('color(display-p3')) {
    const [r = 0, g = 0, b = 0] = numbers.slice(1)
    return displayP3ToLinearSrgb([r, g, b])
  }

  if (value.startsWith('color(srgb')) {
    const [r = 0, g = 0, b = 0] = numbers
    return [linearChannel(clamp(r)), linearChannel(clamp(g)), linearChannel(clamp(b))]
  }

  const [r = 0, g = 0, b = 0] = numbers
  return [linearChannel(r / 255), linearChannel(g / 255), linearChannel(b / 255)]
}

const luminance = (color: string): number => {
  const [r, g, b] = parseComputedColor(color)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * WCAG 2.x contrast ratio between two computed CSS colors.
 *
 * Lets a test assert the criterion itself (for example 3:1 for a focus ring under 1.4.11) rather
 * than a snapshot that would pass at any color.
 */
export const contrastRatio = (foreground: string, background: string): number => {
  const [hi, lo] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (hi! + 0.05) / (lo! + 0.05)
}
