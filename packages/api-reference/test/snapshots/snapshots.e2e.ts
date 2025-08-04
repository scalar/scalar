import { expect, test } from '@playwright/test'
import type { ApiReferenceConfigurationWithSources } from '@scalar/types'
import { serveExample } from '@test/utils/serve-example'

// TODO: We want to pull those documents from the CDN, so the tests don’t fail when they change their API.
// TODO: This should actually use @scalar/galaxy, ideally directly from the file system (so it’ll already fail before we publish an updated version.)

const SOURCES: ApiReferenceConfigurationWithSources['sources'] = [
  {
    slug: 'test-api',
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
  {
    title: 'Scalar Galaxy',
    slug: 'scalar-galaxy-classic-layout',
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    // @ts-expect-error The types are wrong.
    layout: 'classic',
  },
  // {
  //   title: 'Swagger Petstore 2.0',
  //   slug: 'swagger-petstore-2.0',
  //   url: 'https://petstore.swagger.io/v2/swagger.json',
  // },
  // {
  //   title: 'Swagger Petstore 3.0',
  //   slug: 'swagger-petstore-3.0',
  //   url: 'https://petstore3.swagger.io/api/v3/openapi.json',
  // },
  {
    title: 'Swagger Petstore - OpenAPI 3.1',
    slug: 'swagger-petstore-3.1',
    url: 'https://petstore31.swagger.io/api/v31/openapi.json',
  },
  {
    title: 'Val Town API',
    slug: 'valtown',
    url: 'https://docs.val.town/openapi.documented.json',
  },
  // {
  //   title: 'Zoom',
  //   slug: 'zoom',
  //   url: 'https://developers.zoom.us/api-hub/meetings/methods/endpoints.json',
  // },
  // {
  //   title: 'Cloudinary',
  //   slug: 'cloudinary',
  //   url: 'https://cloudinary.com/documentation/schemas/analysis-api/public-schema.yml',
  // },
  // {
  //   title: 'Tailscale',
  //   slug: 'tailscale',
  //   url: 'https://api.tailscale.com/api/v2?outputOpenapiSchema=true',
  // },
  // {
  //   title: 'Maersk',
  //   slug: 'maersk',
  //   url: 'https://edpmediastorage.blob.core.windows.net/media/air_booking_v1-0_26092023_scalar_spec.yaml',
  // },
  // {
  //   title: 'Bolt',
  //   slug: 'bolt',
  //   url: 'https://assets.bolt.com/external-api-references/bolt.yml',
  // },
  // {
  //   title: 'OpenStatus',
  //   slug: 'openstatus',
  //   url: 'https://api.openstatus.dev/v1/openapi',
  // },
]

test.describe('snapshots', () => {
  test('matches all existing snapshots', async ({ page }) => {
    const example = await serveExample({
      sources: SOURCES,
    })

    for (const source of SOURCES) {
      await page.goto(`${example}?api=${source.slug}`)

      // Wait for the page to load
      await expect(page.getByRole('heading', { name: source.title, level: 1 })).toBeVisible()

      // Wait for everything to render
      await page.waitForTimeout(250)

      await expect(page).toHaveScreenshot(`${source.slug}-snapshot.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })
    }
  })
})
