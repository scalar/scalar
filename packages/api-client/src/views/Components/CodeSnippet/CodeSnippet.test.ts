import {
  type RequestExample,
  operationSchema,
  requestExampleSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CodeSnippet from './CodeSnippet.vue'

describe('CodeSnippet', () => {
  it('renders a basic shell/curl request', () => {
    const wrapper = mount(CodeSnippet, {
      props: {
        target: 'shell',
        client: 'curl',
        operation: operationSchema.parse({
          method: 'get',
          path: '/users',
        }),
        server: serverSchema.parse({
          url: 'https://api.example.com',
        }),
      },
    })

    const code = wrapper.find('pre')

    expect(code.text()).toContain('curl https://api.example.com/users')
  })

  it('renders a basic javascript/fetch request', () => {
    const wrapper = mount(CodeSnippet, {
      props: {
        target: 'js',
        client: 'fetch',
        operation: operationSchema.parse({
          method: 'get',
          path: '/users',
        }),
        server: serverSchema.parse({
          url: 'https://api.example.com',
        }),
      },
    })

    const code = wrapper.find('pre')

    expect(code.text()).toContain(`fetch('https://api.example.com/users')`)
  })

  it('uses the request example if provided', () => {
    const wrapper = mount(CodeSnippet, {
      props: {
        target: 'js',
        client: 'fetch',
        operation: operationSchema.parse({
          method: 'post',
          path: '/users',
        }),
        example: requestExampleSchema.parse({
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
                key: 'userId',
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
        server: serverSchema.parse({
          url: 'https://api.example.com/{version}',
        }),
      },
    })

    const code = wrapper.find('pre')

    expect(code.text()).toContain(`fetch('https://api.example.com/{version}/users?search=John', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Set-Cookie': 'sessionId=123'
  },
  body: JSON.stringify({
    name: 'John',
    age: 30
  })
})`)
  })

  it('uses the security schemes if provided', () => {
    const wrapper = mount(CodeSnippet, {
      props: {
        target: 'shell',
        client: 'curl',
        operation: operationSchema.parse({
          method: 'get',
          path: '/users',
        }),
        server: serverSchema.parse({
          url: 'https://api.example.com',
        }),
        securitySchemes: [
          securitySchemeSchema.parse({
            type: 'apiKey',
            in: 'header',
            name: 'X-Api-Key',
            value: '123',
          }),
        ],
      },
    })

    const code = wrapper.find('pre')

    expect(code.text()).toContain(`curl https://api.example.com/users \\
  --header 'X-Api-Key: 123'`)
  })
})
