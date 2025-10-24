import { expect, test } from '@playwright/test'

import sources from '../test/data/sources'

type Sources = typeof sources
type Slug = Sources[number]['slug']

/** A shorter list of slugs to test */
const toTest: Slug[] = ['scalar-galaxy', 'scalar-galaxy-classic']

test.describe.configure({ mode: 'parallel', timeout: 45000 })

sources
  .filter(({ slug }) => toTest.includes(slug))
  .forEach(({ title, slug }) => {
    test(title, async ({ page }) => {
      await page.goto(`?api=${slug}`)

      // // Grab the first tag
      // const tag = await page
      //   .getByRole('region')
      //   .filter({ has: page.getByRole('region', { name: 'Operations' }) })
      //   .first()

      // // Grab the first operation inside the tag
      // const operation = await tag.getByRole('region').nth(1)

      // Click to expand an operation
      if (slug.endsWith('classic')) {
        await page.getByRole('region', { name: 'Operation:' }).first().getByRole('button', { expanded: false }).click()
      }

      // Snapshot a request body
      const requestBody = await page.getByRole('group', { name: 'Request Body' }).first()
      await expect(requestBody).toHaveScreenshot(`${slug}-request-body.png`)

      // Snapshot a request body
      const requestResponses = await page.getByRole('list', { name: 'Responses' }).first()
      await expect(requestResponses).toHaveScreenshot(`${slug}-request-responses.png`)

      // Snapshot a request example
      const requestExample = await page.getByRole('group', { name: 'Request Example' }).first()
      await expect(requestExample).toHaveScreenshot(`${slug}-request-example.png`)
    })
  })
