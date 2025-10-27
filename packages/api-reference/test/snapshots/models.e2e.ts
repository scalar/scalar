import { expect, test } from '@playwright/test'
import { isClassic } from '@test/utils/isClassic'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../data/sources'

/** A shorter list of slugs to test */
const slugs: Slug[] = ['scalar-galaxy', 'scalar-galaxy-classic']
const toTest = sources.filter(({ slug }) => slugs.includes(slug))

/**
 * Takes snapshots of the different model sections
 */
toTest.forEach((source) => {
  const { slug } = source

  test(source.title, async ({ page }) => {
    const example = await serveExample(source)
    await page.goto(example)

    const region = page.getByRole('region', { name: 'Models' })
    if (isClassic(source)) {
      await region.getByRole('button', { expanded: false }).click()
    } else {
      await region.getByRole('button', { name: 'Show' }).click()
    }

    // Models
    // --------------------------------------------------------------------------

    const models = await page.getByRole('region', { name: 'Models' })
    await models.getByRole('button', { name: 'CelestialBody' }).click()
    await models.getByRole('button', { name: 'One of' }).click()
    await models.getByRole('option', { name: 'Satellite' }).click()
    await models.getByRole('button', { name: 'Orbit' }).click()

    const model = await models.getByRole('region', { name: 'CelestialBody' })
    await expect(model).toHaveScreenshot(`${slug}-model.png`)
  })
})
