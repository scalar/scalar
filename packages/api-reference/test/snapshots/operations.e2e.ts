import { expect, test } from '@playwright/test'
import { isClassic } from '@test/utils/is-classic'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../data/sources'

/** A shorter list of slugs to test */
const slugs: Slug[] = ['scalar-galaxy', 'scalar-galaxy-classic']
const toTest = sources.filter(({ slug }) => slugs.includes(slug))

/**
 * Takes snapshots of the different operation sections
 */
toTest.forEach((source) => {
  const { slug } = source

  test(source.title, async ({ page }) => {
    const example = await serveExample(source)
    await page.goto(example)

    // Expand the tag
    const region = page.getByRole('region', { name: 'Planets' })
    if (isClassic(source)) {
      await region.getByRole('button', { expanded: false }).click()
    } else {
      await region.getByRole('button', { name: 'Show' }).click()
    }

    const getAllPlanets = await page.getByRole('region', { name: 'Get all planets' })
    const createAPlanet = await page.getByRole('region', { name: 'Create a planet' })

    // On classic we need to expand the operations
    if (isClassic(source)) {
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
    const requestExample = await createAPlanet.getByRole('group', { name: 'Request Example' })
    await expect(requestExample).toHaveScreenshot(`${slug}-request-example.png`)
  })
})
