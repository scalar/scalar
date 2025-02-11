import {
  type RequestExample,
  operationSchema,
  requestExampleSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ExampleRequest from './ExampleRequest.vue'

describe('ExampleRequest', () => {
  describe('custom code examples', () => {
    it('renders x-codeSamples', async () => {
      const wrapper = mount(ExampleRequest, {
        props: {
          operation: operationSchema.parse({
            'x-codeSamples': {
              javascript: {
                label: 'Custom JS SDK',
                lang: 'javascript',
                source: 'console.log("Hello, world!");',
              },
            },
          }),
        },
      })

      expect(wrapper.text()).toContain('Custom JS SDK')
      expect(wrapper.text()).toContain('console.log("Hello, world!");')
    })

    it('renders x-custom-examples', async () => {
      const wrapper = mount(ExampleRequest, {
        props: {
          operation: operationSchema.parse({
            'x-custom-examples': {
              javascript: {
                label: 'Custom JS SDK',
                lang: 'javascript',
                source: 'console.log("Hello, world!");',
              },
            },
          }),
        },
      })

      expect(wrapper.text()).toContain('Custom JS SDK')
      expect(wrapper.text()).toContain('console.log("Hello, world!");')
    })

    it('renders x-code-samples', async () => {
      const wrapper = mount(ExampleRequest, {
        props: {
          operation: operationSchema.parse({
            'x-code-samples': {
              javascript: {
                label: 'Custom JS SDK',
                lang: 'javascript',
                source: 'console.log("Hello, world!");',
              },
            },
          }),
        },
      })

      expect(wrapper.text()).toContain('Custom JS SDK')
      expect(wrapper.text()).toContain('console.log("Hello, world!");')
    })

    it('renders multiple custom code examples', async () => {
      const wrapper = mount(ExampleRequest, {
        props: {
          operation: operationSchema.parse({
            'x-codeSamples': {
              javascript: {
                label: 'Custom JS SDK',
                lang: 'javascript',
                source: 'console.log("Hello, world!");',
              },
              python: {
                label: 'Custom Python SDK',
                lang: 'python',
                source: 'print("Hello, world!");',
              },
            },
          }),
        },
      })

      expect(wrapper.text()).toContain('Custom JS SDK')
      expect(wrapper.text()).toContain('console.log("Hello, world!");')
      // Just in the select
      expect(wrapper.text()).toContain('Custom Python SDK')
      // Not selected, so not rendered
      expect(wrapper.text()).not.toContain('print("Hello, world!");')
    })
  })

  describe('code snippets', () => {
    it('renders a code example for the given example', async () => {
      const wrapper = mount(ExampleRequest, {
        props: {
          operation: operationSchema.parse({
            method: 'get',
            path: '/planets/{planetId}',
          }),
          server: serverSchema.parse({
            url: 'https://api.example.com',
          }),
          securitySchemes: [
            securitySchemeSchema.parse({
              type: 'apiKey',
              in: 'header',
              name: 'apiKey',
            }),
          ],
          examples: [
            requestExampleSchema.parse({
              body: {
                raw: {
                  encoding: 'json',
                  value: JSON.stringify({
                    name: 'John',
                    age: 30,
                  }),
                },
                activeBody: 'raw',
              },
              parameters: {
                path: [
                  {
                    key: 'planetId',
                    value: '123',
                    enabled: true,
                  },
                ],
                headers: [
                  {
                    key: 'Content-Type',
                    value: 'application/json',
                    enabled: true,
                  },
                ],
                query: [
                  {
                    key: 'search',
                    value: 'John',
                    enabled: true,
                  },
                ],
                cookies: [
                  {
                    key: 'sessionId',
                    value: '123',
                    enabled: true,
                  },
                ],
              },
            } satisfies Partial<RequestExample>),
          ],
        },
      })

      expect(wrapper.text())
        .toContain(`curl 'https://api.example.com/planets/{planetId}?search=John' \\
  --header 'Content-Type: application/json' \\
  --header 'ApiKey: YOUR_SECRET_TOKEN' \\
  --cookie 'sessionId=123' \\
  --data '{
  "name": "John",
  "age": 30
}'`)
    })

    it('renders multiples request examples', async () => {
      const wrapper = mount(ExampleRequest, {
        props: {
          operation: operationSchema.parse({
            method: 'post',
            path: '/planets',
          }),
          server: serverSchema.parse({
            url: 'https://api.example.com',
          }),
          examples: [
            // XML
            requestExampleSchema.parse({
              body: {
                raw: {
                  encoding: 'xml',
                  value: '<xml>Hello, world!</xml>',
                },
                activeBody: 'raw',
              },
            } satisfies Partial<RequestExample>),
            // JSON
            requestExampleSchema.parse({
              body: {
                raw: {
                  encoding: 'json',
                  value: JSON.stringify({
                    name: 'John',
                    age: 30,
                  }),
                },
                activeBody: 'raw',
              },
            } satisfies Partial<RequestExample>),
          ],
        },
      })

      console.log(wrapper.text())

      expect(wrapper.text())
        .toContain(`curl 'https://api.example.com/planets' \\
  --request POST \\
  --header 'Content-Type: application/xml' \\
  --data '<xml>Hello, world!</xml>'`)
    })
  })
})
