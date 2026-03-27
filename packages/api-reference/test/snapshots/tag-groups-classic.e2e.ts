import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

const source = sources.find((s) => s.slug === 'classic-tag-groups')

if (!source) {
  throw new Error('Missing classic-tag-groups test source')
}

/**
 * Visual regression for x-tagGroups rendered as classic layout sections (not flattened like modern).
 */
test(source.title, async ({ page }) => {
  const example = await serveExample(source)
  await page.goto(example)
  await page.goto(`${example}#${source.slug}/tag-group/galaxy`)

  const galaxyGroup = page.getByRole('region', { name: 'Galaxy' })
  await expect(galaxyGroup).toBeVisible()

  await expect(page.getByRole('region', { name: 'Planets' })).toBeVisible()

  await expect(galaxyGroup).toHaveScreenshot('classic-layout-tag-group-galaxy-expanded.png')
})
