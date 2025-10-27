import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('url', () => {
  test('renders Petstore (Swagger 2.0) document', async ({ page }) => {
    const example = await serveExample({
      url: 'https://petstore.swagger.io/v2/swagger.json',
    })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Swagger Petstore', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'pet', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'uploads an image', level: 3 })).toBeVisible()
  })

  test('Should redirect legacy query parameter multi-document support to path routing', async ({ page }) => {
    const example = await serveExample({
      sources: [
        {
          slug: 'api-one',
          content: JSON.stringify({
            openapi: '3.1.1',
            info: {
              title: 'API One',
              version: '1.0.0',
            },
            paths: {
              '/users': {
                get: {
                  summary: 'Get all users',
                  tags: ['user-tag'],
                },
              },
              '/teams': {
                get: {
                  summary: 'Get all team members',
                  tags: ['team-tag'],
                },
              },
            },
          }),
        },
        {
          slug: 'api-two',
          content: JSON.stringify({
            openapi: '3.1.1',
            info: {
              title: 'API Two',
              version: '1.0.0',
            },
            paths: {
              '/pets': {
                get: {
                  summary: 'Get all pets',
                  tags: ['user-tag'],
                },
              },
              '/dogs': {
                get: {
                  summary: 'Get all team members',
                  tags: ['dog-tag'],
                },
              },
            },
          }),
        },
      ],
    })

    console.log('example', example)
    await page.goto(`${example}?api=api-two`)
    await page.pause()

    await expect(page.getByRole('heading', { name: 'API Two', level: 1 })).toBeVisible()
  })
})
