import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('plugins', () => {
  test('renders a plugin view component in the content', async ({ page }) => {
    const example = await serveExample({
      // The plugin is serialized to the page and executed there, so the
      // component has to be self-contained. A render function returning text
      // avoids needing the Vue template compiler (absent in the standalone build).
      plugins: [
        () => ({
          name: 'test-plugin',
          extensions: [],
          views: {
            'content.end': [
              {
                component: { render: () => 'SCALAR_PLUGIN_MARKER' },
              },
            ],
          },
        }),
      ],
      content: {
        openapi: '3.1.1',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      },
    })

    await page.goto(example)

    await expect(page.getByText('SCALAR_PLUGIN_MARKER')).toBeVisible()
  })
})
