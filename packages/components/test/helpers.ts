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
