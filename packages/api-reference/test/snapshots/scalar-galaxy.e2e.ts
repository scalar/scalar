import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('scalar-galaxy', () => {
  test('renders scalar galaxy', async ({ page }) => {
    // TODO: This should actually use @scalar/galaxy, ideally directly from the file system (so it’ll already fail before we publish an updated version.)
    const example = await serveExample({
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
    })

    await page.goto(example)

    // update screenshots with npx playwright test --update-snapshots
    await expect(page).toHaveScreenshot('scalar-galaxy-snapshot.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })
})
