import { expect, test, type Page } from '@playwright/test'

/** A function to take a snapshot (screenshot) */
type SnapshotFn = (
  /** A suffix to add to the snapshot name, e.g. `-open` */
  suffix?: string,
) => Promise<void>

/** A function to test the component */
type TestFn = (context: {
  /** The page object */
  page: Page
  /** A function to take a snapshot (screenshot) */
  snapshot: SnapshotFn
}) => Promise<void>

type ComponentOptions = {
  /**
   * A list of stories to test
   *
   * Must match the story name in Storybook (e.g. `Base`, `With Actions`, `Minimal`)
   */
  stories: string[]
  /**
   * A function to test the component
   *
   * @param page - The page object
   * @param snapshot - A function to take a snapshot (screenshot)
   */
  testFn?: TestFn

  /**
   * Whether to add a background to the component (e.g. white background)
   *
   * @default false
   */
  background?: boolean

  /**
   * The scale factor to use for the snapshot
   *
   * @default 2
   */
  scale?: number
}

const defaultOptions: ComponentOptions = {
  stories: ['Base'],
  scale: 2,
} as const

const formatStorybookUrl = (str: string) => str.replace(/ /g, '-').toLowerCase()

const getSnapshotFn =
  (page: Page, variant: string, options: Partial<ComponentOptions>): SnapshotFn =>
  async (suffix?: string) => {
    const filename = [formatStorybookUrl(variant), suffix ? `-${suffix}` : '', '.png'].join('')
    const screenshotOptions = {
      omitBackground: !options.background,
      stylePath: options.background ? undefined : './test/transparent.css',
    }
    await expect(page.locator('body')).toHaveScreenshot(filename, screenshotOptions)
  }

const getStorybookUrl = (component: string, variant: string) =>
  `/iframe.html?args=&viewMode=story&id=components-${formatStorybookUrl(component)}--${formatStorybookUrl(variant)}`

/**
 * Test a component in Storybook
 */
export function testComponent(component: string, options: Partial<ComponentOptions> = {}) {
  const { stories: variants, testFn, scale } = { ...defaultOptions, ...options }

  for (const variant of variants) {
    test.describe(`${component}@${scale}x`, () => {
      // Use a higher device scale factor for the 2x variant
      test.use({ deviceScaleFactor: scale })

      test(`(${variant})`, async ({ page }) => {
        /** Takes a screenshot of the page and saves it to the snapshots directory */
        const snapshot: SnapshotFn = getSnapshotFn(page, variant, options)

        await page.goto(getStorybookUrl(component, variant))

        // If a test function is provided, use it, otherwise just take a screenshot
        await (testFn ? testFn({ page, snapshot }) : snapshot())
      })
    })
  }
}
