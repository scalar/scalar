import { expect, test } from '@playwright/test'

type ComponentOptions = {
  variants: string[]
}

const defaultOptions: ComponentOptions = {
  variants: ['base'],
} as const

const formatStorybookUrl = (str: string) => str.replace(/ /g, '-').toLowerCase()

/**
 * Test a component in Storybook
 */
export function testComponent(component: string, options: Partial<ComponentOptions> = {}) {
  const componentUri = formatStorybookUrl(component)
  const { variants } = { ...defaultOptions, ...options }

  for (const variant of variants) {
    const variantUri = formatStorybookUrl(variant)

    test(`${component} (${variant})`, async ({ page }) => {
      await page.goto(`/iframe.html?args=&viewMode=story&id=components-${componentUri}--${variantUri}`)
      await expect(page.locator('body')).toHaveScreenshot(`${variantUri}.png`, { omitBackground: true })
    })
  }
}
