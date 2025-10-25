import { expect, test } from '@playwright/test'

import sources from '../data/sources'

type Sources = typeof sources
type Slug = Sources[number]['slug']

/** A shorter list of slugs to test */
const toTest: Slug[] = ['scalar-galaxy', 'scalar-galaxy-classic']

test.describe.configure({ mode: 'parallel', timeout: 45000 })

/**
 * Takes snapshots of various API Reference components across different
 * API sources to ensure consistent rendering.
 */
sources
  .filter(({ slug }) => toTest.includes(slug))
  .forEach(({ title, slug }) => {
    test(title, async ({ page }) => {
      await page.goto(`?api=${slug}`)

      // Operations
      // --------------------------------------------------------------------------

      // Expand the tags

      for (const tag of ['Planets', 'Celestial Bodies', 'Models']) {
        const region = page.getByRole('region', { name: tag })
        if (slug.endsWith('classic')) {
          await region.getByRole('button', { expanded: false }).click()
        } else {
          await region.getByRole('button', { name: 'Show' }).click()
        }
      }

      const getAllPlanets = await page.getByRole('region', { name: 'Get all planets' })
      const createAPlanet = await page.getByRole('region', { name: 'Create a planet' })

      // On classic we need to expand the operations
      if (slug.endsWith('classic')) {
        await getAllPlanets.getByRole('button', { expanded: false }).click()
        await createAPlanet.getByRole('button', { expanded: false }).click()
      }

      // Snapshot the request body
      const requestQueryParams = await getAllPlanets.getByRole('list', { name: 'Query Parameters' })
      await expect(requestQueryParams).toHaveScreenshot(`${slug}-request-query-params.png`)

      // Snapshot the request body
      const requestBody = await createAPlanet.getByRole('group', { name: 'Request Body' })
      await expect(requestBody).toHaveScreenshot(`${slug}-request-body.png`)

      // Snapshot the request response
      const requestResponses = await createAPlanet.getByRole('list', { name: 'Responses' })
      await expect(requestResponses).toHaveScreenshot(`${slug}-request-responses-closed.png`)
      // Open all the responses
      for (const response of await requestResponses.getByRole('button', { name: /\d+/ }).all()) {
        await response.click()
      }
      await expect(requestResponses).toHaveScreenshot(`${slug}-request-responses-open.png`)

      // Snapshot the request callbacks
      const requestCallbacks = await createAPlanet.getByRole('group', { name: 'Callbacks' })
      await requestCallbacks.getByText('planetCreated').first().click()
      await expect(requestCallbacks).toHaveScreenshot(`${slug}-request-callbacks.png`)

      // Snapshot the request example - disabled for now as it's flaky
      // const requestExample = await createAPlanet.getByRole('group', { name: 'Request Example' })
      // await expect(requestExample).toHaveScreenshot(`${slug}-request-example.png`)

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
