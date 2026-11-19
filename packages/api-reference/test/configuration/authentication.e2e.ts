import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    },
  },
}

test.describe('authentication', () => {
  test('prefills the configured api key value', async ({ page }) => {
    const example = await serveExample({
      authentication: {
        securitySchemes: {
          apiKey: {
            value: 'prefilled-token',
          },
        },
      },
      content,
    })

    await page.goto(example)

    await expect(page.getByRole('textbox', { name: 'Value' })).toHaveValue('prefilled-token')
  })

  test('uses the selected document credentials in SDK instructions', async ({ page }) => {
    const example = await serveExample({
      authentication: { securitySchemes: { apiKey: { value: 'example-token' } } },
      content: {
        ...content,
        security: [{}, { apiKey: [] }],
        info: {
          ...content.info,
          'x-scalar-sdk-installation': [
            {
              lang: 'shell',
              label: 'Shell SDK',
              description: 'Install the SDK.\n\n```sh\ninstall sdk\n```\n\n```sh\nconfigure {{apiKey}}\n```',
            },
          ],
        },
        components: {
          securitySchemes: {
            apiKey: {
              ...content.components.securitySchemes.apiKey,
              'x-scalar-credential-placeholders': { apiKey: { field: 'token' } },
            },
          },
        },
      },
    })

    await page.goto(example)
    const panel = page.getByRole('tabpanel', { name: 'Shell SDK' })
    const codeBlocks = panel.getByRole('group', { name: 'Code sample' })
    await expect(codeBlocks).toHaveText(['install sdk', 'configure {{apiKey}}'])
    await expect(panel.getByRole('button', { name: 'Copy code', exact: true })).toHaveCount(2)

    await page.getByRole('button', { name: 'Select Auth Type' }).press('Enter')
    const apiKey = page.getByRole('option', { name: 'apiKey', exact: true })
    await apiKey.click()
    await expect(apiKey).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Escape')

    await expect(codeBlocks).toHaveText(['install sdk', 'configure ••••••••'])
    await expect(panel).not.toContainText('example-token')
  })
})
