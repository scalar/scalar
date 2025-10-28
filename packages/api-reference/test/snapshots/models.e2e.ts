import { expect, test } from '@playwright/test'
import { isClassic } from '@test/utils/is-classic'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../utils/sources'

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

    // Narrow the viewport a bit for models
    await page.setViewportSize({ width: 800, height: 600 })

    const region = page.getByRole('region', { name: 'Models' })
    if (isClassic(source)) {
      await region.getByRole('button', { expanded: false }).click()
    } else {
      await region.getByRole('button', { name: 'Show' }).click()
    }

    // Models
    // --------------------------------------------------------------------------

    const models = await page.getByRole('region', { name: 'Models' })

    // Simple Model
    await models.getByRole('button', { name: 'User' }).click()
    const userModel = await models.getByRole('region', { name: 'User' })
    await expect(userModel).toHaveScreenshot(`${slug}-model-simple.png`)

    // Nested Model
    await models.getByRole('button', { name: 'Satellite' }).click()
    const satelliteModel = await models.getByRole('region', { name: 'Satellite' })
    const enumItem = satelliteModel.getByRole('listitem').filter({ hasText: 'Type: stringenum' })
    await expect(enumItem).toHaveScreenshot(`${slug}-model-enum.png`)

    await models.getByRole('button', { name: 'orbit', expanded: false }).click()
    const nestedItem = satelliteModel.getByRole('listitem').filter({ hasText: 'orbitType: object' })
    await expect(nestedItem).toHaveScreenshot(`${slug}-model-nested.png`)

    // Discriminator
    await models.getByRole('button', { name: 'CelestialBody' }).click()
    const celestialBodyModel = await models.getByRole('region', { name: 'CelestialBody' })
    await celestialBodyModel.getByRole('button', { name: 'One of' }).click()
    await celestialBodyModel.getByRole('option', { name: 'Satellite' }).click()
    await expect(celestialBodyModel).toHaveScreenshot(`${slug}-model-discriminator.png`)
  })
})
