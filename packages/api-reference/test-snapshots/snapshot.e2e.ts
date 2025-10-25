import { type Locator, expect, test } from '@playwright/test'

import sources from '../test/data/sources'

type Sources = typeof sources
type Slug = Sources[number]['slug']

/** A shorter list of slugs to test */
const toTest: Slug[] = ['scalar-galaxy', 'scalar-galaxy-classic']

test.describe.configure({ mode: 'parallel', timeout: 45000 })

async function expandChildAttributes(locator: Locator, maxClicks = 12) {
  let clicks = 0
  while (true) {
    const button = await locator.getByRole('button', { name: 'Show Child Attributes', expanded: false })

    if (clicks >= maxClicks || (await button.count()) === 0) {
      console.log(`Expanded ${clicks} sections`)
      break
    }

    await button.first().click()
    clicks++
  }
}

sources
  .filter(({ slug }) => toTest.includes(slug))
  .forEach(({ title, slug }) => {
    test(title, async ({ page }) => {
      await page.goto(`?api=${slug}`)

      // Operations
      // --------------------------------------------------------------------------

      // On modern we need to expand the tags
      if (!slug.endsWith('classic')) {
        for (const tag of ['Planets', 'Celestial Bodies']) {
          await page.getByRole('button', { name: `Show all ${tag} endpoints` }).click()
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
      await expandChildAttributes(requestQueryParams)

      // Snapshot the request body
      const requestBody = await createAPlanet.getByRole('group', { name: 'Request Body' })
      await expect(requestBody).toHaveScreenshot(`${slug}-request-body.png`)
      await expandChildAttributes(requestBody)

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

      // Snapshot the request example
      const requestExample = await createAPlanet.getByRole('group', { name: 'Request Example' })
      await expect(requestExample).toHaveScreenshot(`${slug}-request-example.png`)

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
