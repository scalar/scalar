import { parse } from '@/helpers'
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

  it('can render the GitHub REST API reference', async () => {
    const definition = await fetch(
      'https://raw.githubusercontent.com/github/rest-api-description/refs/heads/main/descriptions/api.github.com/api.github.com.json',
    ).then((res) => res.json())

    const result = await parse(definition)

    const app = createSSRApp({
      render: () =>
        h(ApiReferenceLayout, {
          configuration: {},
          parsedSpec: result,
          rawSpec: definition,
        }),
    })

    const html = await renderToString(app)

    expect(html).toContain(`GitHub's v3 REST API.`)
  })
})
