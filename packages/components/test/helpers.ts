import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  expect,
  test as base,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  type TestInfo,
} from '@playwright/test'

export { expect }

export type SnapshotFn = (suffix?: string) => Promise<void>

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
  /** Whether to render with a background. Defaults to false. */
  background: boolean
  /** Whether to crop the snapshot to the component root. Defaults to false. */
  crop: boolean
  /** Device scale factor used for screenshots. Defaults to 2. */
  scale: number
  /** Color mode to use for screenshots. Defaults to ['light']. */
  colorModes: ['light'] | ['dark'] | ['light', 'dark']
}

type ComponentTestFixtures = {
  /** Helper to open a specific Storybook story by component and story name. */
  openStory: void
  /** Helper to take a snapshot with a normalized filename and optional suffix. */
  snapshot: SnapshotFn
}

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
  if (component && story) {
    return { component, story }
  }

  // Fall back to the title of the test.describe block and the test block
  const [describeTitle, testTitle] = testInfo.titlePath.slice(-2)
  if (describeTitle && testTitle) {
    return { component: describeTitle, story: testTitle }
  }

  throw new Error(
    'Could not determine component and story from test context, make sure to set a test title and a title for the test.describe block',
  )
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
  background: [false, { option: true }],
  crop: [false, { option: true }],
  scale: [2, { option: true }],
  colorModes: [['light'], { option: true }],

  // Ensure the deviceScaleFactor option is applied by creating a context with scale
  context: async ({ browser, contextOptions, scale }, use, testInfo) => {
    const options: BrowserContextOptions = { ...contextOptions, deviceScaleFactor: scale }
    const context: BrowserContext = await browser.newContext(options)

    // Add an annotation with the scale factor
    testInfo.annotations.push({ type: 'device scale', description: `${scale}x` })

    await use(context)
    await context.close()
  },

  // Utility to open a storybook story
  openStory: [
    async ({ page, component: c, story: s }, use, testInfo) => {
      const { component, story } = componentDetailsFromContext(c, s, testInfo)

      const url = `/iframe.html?args=&viewMode=story&id=components-${toSlug(component)}--${toSlug(story)}`
      await page.goto(url)

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
        const filename = `${toSlug(story)}${suffix ? `-${suffix}` : ''}${colorModeSuffix}.png`
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

type TestBody = Parameters<typeof test>[2]

/**
 * Helper to just take a snapshot of a storybook story
 */
export const takeSnapshot: TestBody = async ({ snapshot }) => await snapshot()
