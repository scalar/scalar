import { renderToString } from '@vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'

import ApiReferenceLayout from './ApiReferenceLayout.vue'

describe('ApiReferenceLayout', () => {
  it('has the title in the HTML output', async () => {
    const app = createSSRApp({
      render: () =>
        h(ApiReferenceLayout, {
          configuration: {},
          parsedSpec: {
            info: {
              title: 'Test API',
            },
          },
          rawSpec: JSON.stringify({
            info: {
              title: 'Test API',
            },
          }),
        }),
    })

    const html = await renderToString(app)

    expect(html).toContain('Test API')
  })
})
