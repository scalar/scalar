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
}

const defaultOptions: ComponentOptions = {
  stories: ['base'],
} as const

const formatStorybookUrl = (str: string) => str.replace(/ /g, '-').toLowerCase()

/**
 * Test a component in Storybook
 */
export function testComponent(component: string, options: Partial<ComponentOptions> = {}) {
  const componentUri = formatStorybookUrl(component)
  const { stories: variants, testFn } = { ...defaultOptions, ...options }

  for (const variant of variants) {
    const variantUri = formatStorybookUrl(variant)

    test(`${component} (${variant})`, async ({ page }) => {
      /** Takes a screenshot of the page and saves it to the snapshots directory */
      const snapshot: SnapshotFn = (suffix?: string) =>
        expect(page.locator('body')).toHaveScreenshot(`${variantUri}${suffix ? `-${suffix}` : ''}.png`, {
          omitBackground: true,
        })

      await page.goto(`/iframe.html?args=&viewMode=story&id=components-${componentUri}--${variantUri}`)

      // If a test function is provided, use it, otherwise just take a screenshot
      await (testFn ? testFn({ page, snapshot }) : snapshot())
    })
  }
}
