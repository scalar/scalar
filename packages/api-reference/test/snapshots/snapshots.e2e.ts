import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

// TODO: We should make the documents an array that we loop over to check the snapshots.

test.describe('snapshots', () => {
  test('matches all existing snapshots', async ({ page }) => {
    const example = await serveExample({
      // TODO: We want to pull those documents from the CDN, so the tests don’t fail when they change their API.
      sources: [
        {
          // TODO: This should actually use @scalar/galaxy, ideally directly from the file system (so it’ll already fail before we publish an updated version.)
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
          title: 'Scalar Galaxy (Classic Layout)',
          slug: 'scalar-galaxy-classic-layout',
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
          // @ts-expect-error The types are wrong.
          layout: 'classic',
        },
        {
          title: 'Swagger Petstore 2.0',
          url: 'https://petstore.swagger.io/v2/swagger.json',
        },
        {
          title: 'Swagger Petstore 3.0',
          url: 'https://petstore3.swagger.io/api/v3/openapi.json',
        },
        {
          title: 'Swagger Petstore 3.1',
          url: 'https://petstore31.swagger.io/api/v31/openapi.json',
        },
        {
          title: 'Valtown',
          url: 'https://docs.val.town/openapi.documented.json',
        },
        {
          title: 'Zoom',
          url: 'https://developers.zoom.us/api-hub/meetings/methods/endpoints.json',
        },
        {
          title: 'Cloudinary',
          url: 'https://cloudinary.com/documentation/schemas/analysis-api/public-schema.yml',
        },
        {
          title: 'Tailscale',
          url: 'https://api.tailscale.com/api/v2?outputOpenapiSchema=true',
        },
        {
          title: 'Maersk',
          url: 'https://edpmediastorage.blob.core.windows.net/media/air_booking_v1-0_26092023_scalar_spec.yaml',
        },
        {
          title: 'Bolt',
          url: 'https://assets.bolt.com/external-api-references/bolt.yml',
        },
        {
          title: 'OpenStatus',
          url: 'https://api.openstatus.dev/v1/openapi',
        },
      ],
    })

    await page.goto(example)
    await expect(page).toHaveScreenshot('scalar-galaxy-snapshot.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })

    await page.goto(`${example}?api=scalar-galaxy-classic-layout`)
    await expect(page).toHaveScreenshot('scalar-galaxy-classic-layout-snapshot.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })

    await page.goto(`${example}?api=valtown`)

    // TODO: use loaded event
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('valtown-snapshot.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })
})
