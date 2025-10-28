import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('sources', () => {
  test('renders multiple sources', async ({ page }) => {
    const example = await serveExample({
      // Otherwise the Planets tag isn't open by default
      defaultOpenAllTags: true,
      sources: [
        {
          slug: 'petstore',
          url: 'https://petstore.swagger.io/v2/swagger.json',
        },
        {
          slug: 'galaxy',
          url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
        },
        {
          slug: 'content',
          content: {
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {
              '/users': {
                get: {
                  summary: 'Get all users',
                  tags: ['user-tag'],
                },
              },
            },
          },
        },
      ],
    })

    // Default source (Petstore)
    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Swagger Petstore', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'pet', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'uploads an image', level: 3 })).toBeVisible()

    // Petstore
    await page.goto(`${example}/?api=petstore`)

    await expect(page.getByRole('heading', { name: 'Swagger Petstore', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'pet', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'uploads an image', level: 3 })).toBeVisible()

    // Galaxy
    await page.goto(`${example}/?api=galaxy`)

    await expect(page.getByRole('heading', { name: 'Scalar Galaxy', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Planets', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all planets', level: 3 })).toBeVisible()

    // Content
    await page.goto(`${example}/?api=content`)

    await expect(page.getByRole('heading', { name: 'Test API', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'user-tag', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all users', level: 3 })).toBeVisible()
  })

  test('uses the default', async ({ page }) => {
    const example = await serveExample({
      // Otherwise the Planets tag isn't open by default
      defaultOpenAllTags: true,
      sources: [
        {
          slug: 'petstore',
          url: 'https://petstore.swagger.io/v2/swagger.json',
        },
        {
          default: true,
          slug: 'content',
          content: {
            openapi: '3.1.1',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            paths: {
              '/users': {
                get: {
                  summary: 'Get all users',
                  tags: ['user-tag'],
                },
              },
            },
          },
        },
      ],
    })

    // Default source (Content)
    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Test API', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'user-tag', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all users', level: 3 })).toBeVisible()

    // Petstore
    await page.goto(`${example}/?api=petstore`)

    await expect(page.getByRole('heading', { name: 'Swagger Petstore', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'pet', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'uploads an image', level: 3 })).toBeVisible()

    // Content
    await page.goto(`${example}/?api=content`)

    await expect(page.getByRole('heading', { name: 'Test API', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'user-tag', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all users', level: 3 })).toBeVisible()
  })
})
