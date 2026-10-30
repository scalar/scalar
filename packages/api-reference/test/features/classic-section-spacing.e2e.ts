import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const getGapAboveModels = async (
  page: Page,
  operation: Record<string, unknown>,
  upperSection: string,
): Promise<number> => {
  const example = await serveExample({
    layout: 'classic',
    content: {
      openapi: '3.1.2',
      info: { title: 'Spacing API', version: '1.0.0' },
      paths: {
        '/users': { get: { summary: 'List users', responses: { '200': { description: 'OK' } }, ...operation } },
      },
      components: { schemas: { User: { type: 'object', properties: { id: { type: 'string' } } } } },
    },
  })

  await page.goto(example)

  const upper = await page.getByRole('region', { name: upperSection, exact: true }).boundingBox()
  const models = await page.getByRole('region', { name: 'Models', exact: true }).boundingBox()

  if (!upper || !models) {
    throw new Error('Both sections must be visible to measure the gap between them')
  }

  return models.y - (upper.y + upper.height)
}

test('separates untagged operations from the Models section like a tag in the classic layout', async ({ page }) => {
  const gapAfterTag = await getGapAboveModels(page, { tags: ['Users'] }, 'Users')
  const gapAfterUntaggedOperation = await getGapAboveModels(page, {}, 'List users')

  expect(gapAfterTag).toBeGreaterThan(0)
  expect(gapAfterUntaggedOperation).toBe(gapAfterTag)
})
