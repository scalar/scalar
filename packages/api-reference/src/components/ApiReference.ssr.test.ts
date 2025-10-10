import { apiReferenceConfigurationWithSourceSchema } from '@scalar/types/api-reference'
import { renderToString } from '@vue/server-renderer'
import { expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'

import ApiReference from '@/components/ApiReference.vue'

// ---------------------------------------------------------------------------

const EXAMPLE_API_DEFINITIONS = [
  {
    title: 'GitHub v3 REST API',
    url: 'https://raw.githubusercontent.com/github/rest-api-description/refs/heads/main/descriptions/api.github.com/api.github.com.json',
    name: 'githubs-v3-rest-api-0.json',
  },
  {
    title: 'Scalar Galaxy',
    url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
    name: 'scalar-galaxy-1.json',
  },
  {
    title: 'Scalar Galaxy',
    url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
    name: 'scalar-galaxy-2.yaml',
  },
  {
    title: 'Stripe',
    url: 'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.yaml',
    name: 'stripe-3.yaml',
  },
  {
    title: 'Swagger Petstore',
    url: 'https://petstore.swagger.io/v2/swagger.json',
    name: 'swagger-petstore-4.json',
  },
  {
    title: 'Swagger Petstore',
    url: 'https://petstore3.swagger.io/api/v3/openapi.json',
    name: 'swagger-petstore-5.json',
  },
  {
    title: 'Swagger Petstore',
    url: 'https://petstore31.swagger.io/api/v31/openapi.json',
    name: 'swagger-petstore-6.json',
  },
  {
    title: 'Val Town',
    url: 'https://docs.val.town/openapi.documented.json',
    name: 'val-town-7.json',
  },
  {
    title: 'Outline',
    url: 'https://raw.githubusercontent.com/outline/openapi/refs/heads/main/spec3.yml',
    name: 'outline-8.yaml',
  },
  {
    title: 'API Reference',
    url: 'https://raw.githubusercontent.com/getsentry/sentry/refs/heads/master/api-docs/openapi.json',
    name: 'sentry-9.json',
  },
  {
    title: 'Vercel',
    url: 'https://openapi.vercel.sh/',
    name: 'vercel-10.json',
  },
]

it.each(EXAMPLE_API_DEFINITIONS)('$title ($url)', async ({ title, name }) => {
  // Spy for console.error to avoid errors in the console
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  if (!document) {
    console.log(`Failed to fetch definition for https://fixtures.staging.scalar.com/layout-reference/${name}`)
    throw new Error('Failed to fetch')
  }

  const app = createSSRApp({
    render: () =>
      h(ApiReference, {
        configuration: apiReferenceConfigurationWithSourceSchema.parse({
          url: `https://fixtures.staging.scalar.com/layout-reference/${name}`,
        }),
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
})
