import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/users': {
      get: {
        summary: 'Get all users',
        tags: ['Users'],
        responses: {
          '200': {
            description: 'A list of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    // The description only renders in the expanded schema table,
                    // not in the always-visible example, so it is a reliable marker
                    totalUsers: { type: 'number', description: 'RESPONSE_SCHEMA_MARKER' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

test.describe('expandAllResponses', () => {
  test('keeps response sections collapsed by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    await expect(page.getByText('RESPONSE_SCHEMA_MARKER')).not.toBeVisible()
  })

  test('expands all response sections when enabled', async ({ page }) => {
    const example = await serveExample({ expandAllResponses: true, content })

    await page.goto(example)

    await expect(page.getByText('RESPONSE_SCHEMA_MARKER').first()).toBeVisible()
  })
})
