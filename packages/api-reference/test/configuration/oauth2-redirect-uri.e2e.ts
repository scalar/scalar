import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  security: [{ oauth2: [] }],
  components: {
    securitySchemes: {
      oauth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://auth.example.com/authorize',
            tokenUrl: 'https://auth.example.com/token',
            scopes: {},
          },
        },
      },
    },
  },
}

test.describe('oauth2RedirectUri', () => {
  test('prefills the redirect URL field with the configured uri', async ({ page }) => {
    const example = await serveExample({
      oauth2RedirectUri: 'myapp://oauth/callback',
      content,
    })

    await page.goto(example)

    // The redirect URL renders in a custom code input whose accessible name is
    // not "Redirect URL", so we assert on the prefilled value being visible.
    await expect(page.getByText('myapp://oauth/callback')).toBeVisible()
  })
})
