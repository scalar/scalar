import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Page, TestInfo, devices as playwrightDevices } from '@playwright/test'

import { type ThemeVariantId, defaultThemeVariant } from '@scalar/helpers/storybook/themes'

/**
 * Themes to snapshot components under, beyond the default.
 *
 * `rounded-none` and `rounded-full` sit at either end of the radius scale. Laserwave is a real
 * preset, so it also proves the decorator applies a theme's colours, not only a token override, and
 * it is the one preset that ships its own radii.
 */
export const themes = ['rounded-none', 'rounded-full', 'laserwave'] as const satisfies ThemeVariantId[]

export type SnapshotFn = (suffix?: string) => Promise<void>

type StoryTestArgs = Record<string, string | number | boolean | null | undefined>

/**
 * Options shared by every visual test host.
 *
 * The host decides how a story is rendered; these describe what to render and how to capture it, so
 * a test body reads the same whether it runs against Storybook or the Playwright gallery.
 */
export type ComponentTestOptions = {
  /**
   * The component to test.
   *
   * Falls back to the title of the test.describe block if not provided.
   */
  component: string | undefined
  /**
   * The story to test.
   *
   * Falls back to the title of the test block if not provided.
   */
  story: string | undefined
  /**
   * The args to pass to the story.
   *
   * Falls back to the args of the test block if not provided.
   */
  args: StoryTestArgs | undefined
  /** Whether to render with a background. Defaults to false. */
  background: boolean
  /** Whether to crop the snapshot to the component root, body, or viewport. Defaults to 'body'. */
  crop: 'component' | 'body' | 'viewport'
  /** Device scale factor used for screenshots. Defaults to 2. */
  scale: number
  /**
   * Maximum number of pixels that may differ before a snapshot fails.
   *
   * Overrides the project wide ratio, which scales with the viewport and is therefore too generous
   * for tests where the difference under test covers only a few glyphs. Defaults to the ratio.
   */
  maxDiffPixels: number | undefined
  /** Device to emulate. Defaults to no device emulation. */
  device: Device | undefined
  /** Color mode to use for screenshots. Defaults to ['light']. */
  colorModes: ['light'] | ['dark'] | ['light', 'dark']
  /**
   * Theme to render the story under. Defaults to 'default'.
   *
   * The theme is chosen when the story loads rather than between snapshots, so a test can interact
   * with a component and hold that state across every snapshot it takes. To cover several themes,
   * wrap the test in a describe block per theme.
   */
  theme: ThemeVariantId
}

export type Device = keyof typeof devices

/**
 * A simplified list of playwright devices to be made available to tests
 *
 * @see https://playwright.dev/docs/emulation#devices
 */
export const devices = {
  'Chrome': 'Desktop Chrome',
  'Firefox': 'Desktop Firefox',
  'Safari': 'Desktop Safari',
  'Edge': 'Desktop Edge',
} as const satisfies Record<string, keyof typeof playwrightDevices>

function toSlug(input: string): string {
  return input.replace(/ /g, '-').toLowerCase()
}

const currentDir = path.dirname(fileURLToPath(import.meta.url))

/** Stylesheet that clears the page background so a snapshot can be taken with transparency. */
export const transparentCssPath = path.resolve(currentDir, './transparent.css')

export const componentDetailsFromContext = (
  component: string | undefined,
  story: string | undefined,
  testInfo: TestInfo,
): { component: string; story: string } => {
  // Extract the title of the test.describe block and the test block
  const [describeTitle, testTitle] = testInfo.titlePath.slice(-2)

  const componentName = component ?? describeTitle
  const storyName = story ?? testTitle

  if (!componentName || !storyName) {
    throw new Error(
      'Could not determine component and story from test context, make sure to set a test title and a title for the test.describe block',
    )
  }

  return { component: componentName, story: storyName }
}

/**
 * Builds the snapshot filename for a story.
 *
 * Both hosts share this so that a test written against either one resolves to the same committed
 * PNG, which is what makes them comparable at all.
 */
export const snapshotFilename = ({
  story,
  suffix,
  theme,
  colorMode,
}: {
  story: string
  suffix?: string
  theme: ThemeVariantId
  colorMode: 'light' | 'dark'
}): string => {
  const themeSuffix = theme === defaultThemeVariant ? '' : `-${toSlug(theme)}`
  const colorModeSuffix = colorMode === 'light' ? '' : `-${colorMode}`

  return `${toSlug(story)}${suffix ? `-${toSlug(suffix)}` : ''}${themeSuffix}${colorModeSuffix}.png`
}

/**
 * Sets the color mode for the page using a class
 */
export const setColorMode = async (page: Page, colorMode: 'light' | 'dark') => {
  const body = await page.locator('body').elementHandle()

  if (colorMode === 'dark') {
    await body?.evaluate((el) => {
      el.classList.add('dark-mode')
      el.classList.remove('light-mode')
    })
  } else {
    await body?.evaluate((el) => {
      el.classList.add('light-mode')
      el.classList.remove('dark-mode')
    })
  }
}
