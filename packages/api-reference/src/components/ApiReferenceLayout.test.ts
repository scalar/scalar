// @vitest-environment node
import { parse } from '@/helpers'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
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
    // Spy for console.error to avoid errors in the console
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

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

    // Check if console.error was called
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    // Restore the original console.error
    consoleErrorSpy.mockRestore()

    // Check if console.warn was called
    // TODO: In the future, we should fix the warnings.
    // expect(consoleWarnSpy).not.toHaveBeenCalled()

    // Restore the original console.warn
    consoleWarnSpy.mockRestore()

    // Verify it renders the title in the HTML output
    expect(html).toContain(`GitHub's v3 REST API.`)
  })
})
