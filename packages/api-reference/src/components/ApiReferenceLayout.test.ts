// @vitest-environment node
import { parse } from '@/helpers'
import { renderToString } from '@vue/server-renderer'
import { describe, expect, it, test, vi } from 'vitest'
import { createSSRApp, h } from 'vue'

import ApiReferenceLayout from './ApiReferenceLayout.vue'

const EXAMPLE_API_DEFINITIONS = [
  {
    title: `GitHub's v3 REST API.`,
    url: 'https://raw.githubusercontent.com/github/rest-api-description/refs/heads/main/descriptions/api.github.com/api.github.com.json',
  },
  {
    title: 'Scalar Galaxy',
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  {
    title: 'Scalar Galaxy',
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
  },
  {
    title: 'Stripe',
    url: 'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.yaml',
  },
  {
    title: 'Swagger Petstore',
    url: 'https://petstore.swagger.io/v2/swagger.json',
  },
  {
    title: 'Swagger Petstore',
    url: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },
  {
    title: 'Swagger Petstore',
    url: 'https://petstore31.swagger.io/api/v31/openapi.json',
  },
  {
    title: 'Val Town',
    url: 'https://docs.val.town/openapi.documented.json',
  },
  {
    title: 'Outline',
    url: 'https://raw.githubusercontent.com/outline/openapi/refs/heads/main/spec3.yml',
  },
  {
    title: 'Sentry',
    url: 'https://raw.githubusercontent.com/getsentry/sentry/refs/heads/master/api-docs/openapi.json',
  },
  {
    title: 'Vercel',
    url: 'https://openapi.vercel.sh/',
  },
] as const

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

  describe('real-world examples', () => {
    test.each(EXAMPLE_API_DEFINITIONS)(
      `$title ($url)`,
      async ({ url, title }) => {
        // Spy for console.error to avoid errors in the console
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {})

        const definition = await fetch(url).then((res) => res.text())

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
        expect(html).toContain(title)
      },
      // Increase timeout to 10 seconds
      10 * 1000,
    )
  })
})
