import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  expect,
  test as base,
  devices as playwrightDevices,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  type TestInfo,
} from '@playwright/test'

export { expect }

export type Device = keyof typeof devices

export type TestBody = Parameters<typeof test>[2]

export type SnapshotFn = (suffix?: string) => Promise<void>

export type StoryTestArgs = Record<string, string | number | boolean | null | undefined>

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
  /** Whether to crop the snapshot to the component root. Defaults to false. */
  crop: boolean
  /** Device scale factor used for screenshots. Defaults to 2. */
  scale: number
  /** Device to emulate. Defaults to no device emulation. */
  device: Device | undefined
  /** Color mode to use for screenshots. Defaults to ['light']. */
  colorModes: ['light'] | ['dark'] | ['light', 'dark']
}

type ComponentTestFixtures = {
  /** Helper to open a specific Storybook story by component and story name. */
  openStory: void
  /** Helper to take a snapshot with a normalized filename and optional suffix. */
  snapshot: SnapshotFn
}

/**
 * A simplified list of playwright devices to be made available to tests
 *
 * @see https://playwright.dev/docs/emulation#devices
 */
const devices = {
  'Chrome': 'Desktop Chrome',
  'Firefox': 'Desktop Firefox',
  'Safari': 'Desktop Safari',
  'Edge': 'Desktop Edge',
} as const satisfies Record<string, keyof typeof playwrightDevices>

function toSlug(input: string): string {
  return input.replace(/ /g, '-').toLowerCase()
}

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const transparentCssPath = path.resolve(currentDir, './transparent.css')

const componentDetailsFromContext = (
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
 * Encodes a single story arg to Storybook URL format
 */
const encodeStoryArg = (value: StoryTestArgs[string]): string => {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return `!${encodeURIComponent(String(value))}`
  }
  return encodeURIComponent(String(value))
}

/**
 * Serializes args to Storybook URL format
 *
 * See: https://storybook.js.org/docs/writing-stories/args#setting-args-through-the-url
 */
const encodeStoryArgs = (args?: StoryTestArgs): string => {
  if (!args || Object.keys(args).length === 0) {
    return ''
  }

  return Object.entries(args)
    .map(([k, v]) => `${k}:${encodeStoryArg(v)}`)
    .join(';')
}

/**
 * Sets the color mode for the page using a class
 */
const setColorMode = async (page: Page, colorMode: 'light' | 'dark') => {
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

export const test = base.extend<ComponentTestOptions & ComponentTestFixtures>({
  // Options (can be overridden per test via test.use)
  component: [undefined, { option: true }],
  story: [undefined, { option: true }],
  args: [undefined, { option: true }],
  background: [false, { option: true }],
  crop: [false, { option: true }],
  scale: [2, { option: true }],
  device: [undefined, { option: true }],
  colorModes: [['light'], { option: true }],

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

  // Utility to open a storybook story
  openStory: [
    async ({ page, component: c, story: s, args }, use, testInfo) => {
      const { component, story } = componentDetailsFromContext(c, s, testInfo)

      const params = [
        ['viewMode', 'story'],
        ['id', `components-${toSlug(component)}--${toSlug(story)}`],
        ['args', encodeStoryArgs(args)],
      ]

      await page.goto(`iframe.html?${params.map(([k, v]) => `${k}=${v}`).join('&')}`, {
        waitUntil: 'networkidle',
      })

      const error = await page.locator('.sb-errordisplay #error-message').textContent()
      expect(error, `${error}`).toBeFalsy()

      await use()
    },
    { auto: true },
  ],

  // Snapshot helper bound to current test settings
  snapshot: async ({ page, background, crop, colorModes, component: c, story: s }, use, testInfo) => {
    const takeSnapshot: SnapshotFn = async (suffix?: string): Promise<void> => {
      const { story } = componentDetailsFromContext(c, s, testInfo)
      const locator = crop ? '#storybook-root > *' : 'body'
      for (const colorMode of colorModes) {
        const colorModeSuffix = colorMode === 'light' ? '' : `-${colorMode}`
        const filename = `${toSlug(story)}${suffix ? `-${toSlug(suffix)}` : ''}${colorModeSuffix}.png`
        await setColorMode(page, colorMode)
        await expect(page.locator(locator)).toHaveScreenshot(filename, {
          omitBackground: !background,
          stylePath: background ? undefined : transparentCssPath,
        })
      }
    }

    await use(takeSnapshot)
  },
})

/**
 * Helper to just take a snapshot of a storybook story
 */
export const takeSnapshot: TestBody = async ({ snapshot }) => await snapshot()
