import { expect, test } from '@playwright/test'
import { isClassic } from '@test/utils/is-classic'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../utils/sources'

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

    await page.goto(`${example}#${slug}/tag/planets`)
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
      await getAllPlanets.getByRole('button', { name: 'Get all planets', expanded: false }).click()
      await createAPlanet.getByRole('button', { name: 'Create a planet', expanded: false }).click()
    }

    // Snapshot the query parameters
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
    await expect(requestCallbacks).toHaveScreenshot(`${slug}-request-callbacks.png`)

    // Snapshot the request example
    const requestExample = await createAPlanet.getByRole('group', { name: 'Request Example' })
    await expect(requestExample).toHaveScreenshot(`${slug}-request-example.png`)
  })
})

const longStringsSource = sources.find((s) => s.slug === 'long-strings')
if (!longStringsSource) {
  throw new Error('sources must include long-strings for operations snapshots')
}

/**
 * Long strings example: GET (query parameters) and POST (shared virtualization fixture for body + example responses).
 */
test(longStringsSource.title, async ({ page }) => {
  const example = await serveExample(longStringsSource)
  await page.goto(example)

  await page.goto(`${example}/#tag/really-extremely-long-tag-name-that-definitely-tests-wrapping-across-multiple-lines`)
  const tagRegionGet = page.getByRole('region', {
    name: 'Really Extremely Long Tag Name That Definitely Tests Wrapping Across Multiple Lines',
  })

  expect(tagRegionGet).toBeVisible()

  const getOperation = page.getByRole('region', {
    name: 'Really extremely long operation summary that definitely needs to wrap across multiple lines in the UI',
  })

  await expect(getOperation.getByRole('list', { name: 'Query Parameters' })).toHaveScreenshot(
    `${longStringsSource.slug}-request-query-params.png`,
  )

  await page.goto(`${example}/#tag/another-extremely-super-long-tag-name-that-needs-wrapping-for-ui-testing`)

  const tagRegionPost = page.getByRole('region', {
    name: 'Another Extremely Super Long Tag Name That Needs Wrapping For UI Testing',
  })

  expect(tagRegionPost).toBeVisible()

  const postOperation = page.getByRole('region', {
    name: 'Another really extremely long operation summary for POST request that needs wrapping',
  })

  expect(postOperation).toBeVisible()

  await expect(postOperation.getByRole('group', { name: 'Request Body' })).toHaveScreenshot(
    `${longStringsSource.slug}-request-body.png`,
  )

  const requestResponses = postOperation.getByRole('list', { name: 'Responses' })
  await expect(requestResponses).toHaveScreenshot(`${longStringsSource.slug}-request-responses-closed.png`)
  for (const response of await requestResponses.getByRole('button', { name: /\d+/ }).all()) {
    await response.click()
  }
  await expect(requestResponses).toHaveScreenshot(`${longStringsSource.slug}-request-responses-open.png`)

  await expect(postOperation.getByRole('group', { name: 'Request Example' })).toHaveScreenshot(
    `${longStringsSource.slug}-request-example.png`,
  )
})
