import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const patternContent = {
  openapi: '3.1.0',
  info: { title: 'Pattern Test', version: '1.0.0' },
  paths: {
    '/users': {
      post: {
        summary: 'Create a user',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9_]{3,20}$',
                    description: 'Alphanumeric username',
                  },
                  email: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                    description: 'Valid email address',
                  },
                  password: {
                    type: 'string',
                    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
                    description: 'Strong password (long complex regex)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
        },
      },
    },
  },
}

test.describe('pattern hover dropdown', () => {
  // A fixed, wide viewport keeps the absolute-positioned popup snapshots stable.
  test.use({ viewport: { width: 900, height: 700 } })

  test.beforeEach(async ({ page }) => {
    const example = await serveExample({ content: patternContent })

    // Deep-link straight to the operation so its request body is rendered.
    await page.goto(`${example}#tag/users/post-users`)
    await expect(page.getByRole('group', { name: 'Request Body' })).toBeVisible()
  })

  test('shows Pattern button inline for a string property with pattern', async ({ page }) => {
    const requestBody = page.getByRole('group', { name: 'Request Body' })

    // The Pattern label button should be visible for the username field
    const usernameRow = requestBody.locator('.property').filter({ hasText: 'username' }).first()
    await expect(usernameRow.getByRole('button', { name: 'Pattern' }).first()).toBeVisible()

    await expect(usernameRow).toHaveScreenshot('pattern-button-visible.png')
  })

  test('shows full pattern in popup on hover', async ({ page }) => {
    const requestBody = page.getByRole('group', { name: 'Request Body' })

    const usernameRow = requestBody.locator('.property').filter({ hasText: 'username' }).first()
    const patternTrigger = usernameRow.locator('.property-pattern')

    // Hover to reveal the popup
    await patternTrigger.hover()
    const popup = patternTrigger.locator('.property-pattern-popup')
    await expect(popup).toBeVisible()
    await expect(popup.locator('code')).toHaveText('^[a-zA-Z0-9_]{3,20}$')

    // Snapshot the full request body so the absolute-positioned popup is visible
    await expect(requestBody).toHaveScreenshot('pattern-popup-hover.png')
  })

  test('shows full long regex pattern in popup without truncation', async ({ page }) => {
    const requestBody = page.getByRole('group', { name: 'Request Body' })

    const passwordRow = requestBody.locator('.property').filter({ hasText: 'password' }).first()
    const patternTrigger = passwordRow.locator('.property-pattern')

    await patternTrigger.hover()
    const popup = patternTrigger.locator('.property-pattern-popup')
    await expect(popup).toBeVisible()
    await expect(popup.locator('code')).toHaveText(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    )

    // Snapshot the full request body so the absolute-positioned popup is visible
    await expect(requestBody).toHaveScreenshot('pattern-popup-long-regex.png')
  })

  test('request body with pattern fields snapshot', async ({ page }) => {
    const requestBody = page.getByRole('group', { name: 'Request Body' })

    await expect(requestBody).toHaveScreenshot('pattern-request-body.png')
  })
})
