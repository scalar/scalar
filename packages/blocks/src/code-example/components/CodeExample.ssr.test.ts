import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { mockEventBus } from '../test-utils'
import CodeExample from './CodeExample.vue'

/** Server-renders an operation whose request body has named examples. */
const renderCodeExample = (): Promise<string> =>
  renderToString(
    createSSRApp({
      render: () =>
        h(CodeExample, {
          eventBus: mockEventBus,
          method: 'post',
          path: '/planets',
          clientOptions: [
            {
              label: 'Shell',
              key: 'shell',
              options: [
                {
                  id: 'shell/curl',
                  label: 'Curl',
                  lang: 'curl',
                  title: 'Shell Curl',
                  targetKey: 'shell',
                  targetTitle: 'Shell',
                  clientKey: 'curl',
                },
              ],
            },
          ],
          selectedClient: 'shell/curl',
          selectedServer: { url: 'https://example.com' },
          securitySchemes: [],
          operation: {
            summary: 'Create a planet',
            requestBody: {
              content: {
                'application/json': {
                  examples: {
                    mars: { summary: 'Mars', value: { name: 'Mars' } },
                    venus: { summary: 'Venus', value: { name: 'Venus' } },
                  },
                },
              },
            },
          },
        }),
    }),
  )

/**
 * Lifecycle hooks such as `onBeforeMount` do not run on the server. An initial example chosen
 * there is missing from the server markup, so the browser's first render disagrees with it.
 */
describe('CodeExample.ssr', () => {
  it('renders the first request example on the server', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderCodeExample()

    expect(container.querySelector('[data-testid="example-picker"]')?.textContent?.trim()).toBe('Mars')
  })
})
