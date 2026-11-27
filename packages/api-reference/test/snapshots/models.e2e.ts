import { expect, test } from '@playwright/test'
import { isClassic } from '@test/utils/is-classic'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../utils/sources'

test('shows each allOf model description on its own card', async ({ page }) => {
  const employeeDescription = 'An employee in the company directory.'
  const personDescription = 'Basic information about a person.'
  const example = await serveExample({
    layout: 'modern',
    showSidebar: false,
    forceDarkModeState: 'light',
    expandAllModelSections: true,
    content: {
      openapi: '3.1.0',
      info: { title: 'Company Directory', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Employee: {
            description: employeeDescription,
            allOf: [
              { $ref: '#/components/schemas/Person' },
              { type: 'object', properties: { employeeId: { type: 'string' } } },
            ],
          },
          Person: {
            type: 'object',
            description: personDescription,
            properties: { fullName: { type: 'string' } },
          },
        },
      },
    },
  })

  await page.setViewportSize({ width: 800, height: 600 })
  await page.goto(`${example}#models`)

  const models = page.getByRole('region', { name: 'Models' })
  const employee = models.getByRole('region', { name: 'Employee', exact: true })
  const person = models.getByRole('region', { name: 'Person', exact: true })
  await expect(employee.getByText(employeeDescription, { exact: true })).toBeVisible()
  await expect(employee.getByText(personDescription, { exact: true })).toHaveCount(0)
  await expect(employee.getByText('fullName', { exact: true })).toBeVisible()
  await expect(person.getByText(personDescription, { exact: true })).toBeVisible()

  await expect(models).toHaveScreenshot('allof-model-descriptions.png')
})

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

    // Content is virtualized: navigate to the models section by id so it is rendered.
    await page.goto(`${example}#${slug}/models`)

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
    await page.goto(`${example}#${slug}/models/user`)
    await models.getByRole('button', { name: 'User' }).click()
    const userModel = await models.getByRole('region', { name: 'User' })
    await expect(userModel).toHaveScreenshot(`${slug}-model-simple.png`)

    // Nested Model
    await models.getByRole('button', { name: 'Satellite' }).click()
    const satelliteModel = await models.getByRole('region', { name: 'Satellite' })
    const enumItem = satelliteModel
      .getByRole('listitem')
      .filter({ hasText: 'Type: string' })
      .filter({ hasText: 'enum' })
    await expect(enumItem).toHaveScreenshot(`${slug}-model-enum.png`)

    await models.getByRole('button', { name: 'orbit', expanded: false }).click()
    const nestedItem = satelliteModel
      .getByRole('listitem')
      .filter({ hasText: 'orbit' })
      .filter({ hasText: 'Type: object' })
    await expect(nestedItem).toHaveScreenshot(`${slug}-model-nested.png`)

    // Discriminator
    await page.goto(`${example}#${slug}/models/celestialbody`)
    await models.getByRole('button', { name: 'CelestialBody' }).click()
    const celestialBodyModel = await models.getByRole('region', { name: 'CelestialBody' })
    await celestialBodyModel.getByRole('button', { name: 'One of' }).click()
    await celestialBodyModel.getByRole('option', { name: 'Satellite' }).click()
    await expect(celestialBodyModel).toHaveScreenshot(`${slug}-model-discriminator.png`)
  })
})
