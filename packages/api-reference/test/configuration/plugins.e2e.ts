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

  test('loads a browser module with local component bindings and skips failed imports', async ({ page }) => {
    const errors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text())
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.route('**/broken-plugin.js', (route) => route.abort())

    const example = await serveExample({
      pluginUrls: ['/broken-plugin.js', '/examples/plugins/custom-extension.js'],
      content: {
        openapi: '3.1.0',
        info: { title: 'Plugin example', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Hello',
              'x-custom-extension': 'Rendered in the browser',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      },
    })

    await page.goto(example)

    await expect(page.getByText('Custom extension: Rendered in the browser', { exact: true })).toBeVisible()
    await expect(page.getByText('Powered by Scalar', { exact: true })).toBeVisible()
    expect(errors.some((error) => error.includes('Failed to load the plugin module at /broken-plugin.js'))).toBe(true)
    expect(pageErrors).toStrictEqual([])
  })
})
