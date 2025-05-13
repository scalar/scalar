// @vitest-environment jsdom
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { mount } from '@vue/test-utils'

import { describe, expect, it, vi } from 'vitest'
import MarkdownReference from './MarkdownReference.vue'

// Mock the ScalarMarkdown component
vi.mock('@scalar/components', () => ({
  ScalarMarkdown: {
    name: 'ScalarMarkdown',
    props: ['value'],
    template: '<div class="scalar-markdown">{{ value }}</div>',
  },
}))

describe('MarkdownReference', () => {
  it('renders basic API information', () => {
    const content: OpenAPIV3_1.Document = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test description',
      },
      paths: {},
    }

    const wrapper = mount(MarkdownReference, {
      props: { content },
    })

    expect(wrapper.text()).toContain('Test API')
    expect(wrapper.text()).toContain('OpenAPI Version:')
    expect(wrapper.text()).toContain('3.1.1')
    expect(wrapper.text()).toContain('API Version:')
    expect(wrapper.text()).toContain('1.0.0')
    expect(wrapper.text()).toContain('Test description')
  })

  it('renders servers section with variables', () => {
    const content: OpenAPIV3_1.Document = {
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      servers: [
        {
          url: 'https://test.com',
          description: 'Test server',
        },
        {
          url: 'https://test.com/{version}',
          description: 'Test server v2',
          variables: {
            version: {
              default: 'v2',
              description: 'Test version',
            },
          },
        },
      ],
      paths: {},
    }

    const wrapper = mount(MarkdownReference, { props: { content } })
    expect(wrapper.text()).toContain('Servers')
    expect(wrapper.text()).toContain('https://test.com')
    expect(wrapper.text()).toContain('Test server')
    expect(wrapper.text()).toContain('https://test.com/{version}')
    expect(wrapper.text()).toContain('Test server v2')
    expect(wrapper.text()).toContain('version')
    expect(wrapper.text()).toContain('v2')
    expect(wrapper.text()).toContain('Test version')
  })

  it('renders operations section with summary, tags, stability, and request/response', () => {
    const content: OpenAPIV3_1.Document = {
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            description: 'Get all users',
            tags: ['users'],
            'x-scalar-stability': 'stable',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { filter: { type: 'string' } },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
    const wrapper = mount(MarkdownReference, { props: { content } })
    expect(wrapper.text()).toContain('Operations')
    expect(wrapper.text()).toContain('Get users')
    expect(wrapper.text()).toContain('GET')
    expect(wrapper.text()).toContain('/users')
    expect(wrapper.text()).toContain('users')
    expect(wrapper.text()).toContain('stable')
    expect(wrapper.text()).toContain('Get all users')
    expect(wrapper.text()).toContain('Request Body')
    expect(wrapper.text()).toContain('filter')
    expect(wrapper.text()).toContain('Responses')
    expect(wrapper.text()).toContain('200')
    expect(wrapper.text()).toContain('Array of:')
    expect(wrapper.text()).toContain('string')
  })

  it('renders deprecated operation', () => {
    const content: OpenAPIV3_1.Document = {
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/deprecated': {
          post: {
            deprecated: true,
            description: 'Deprecated operation',
          },
        },
      },
    }
    const wrapper = mount(MarkdownReference, { props: { content } })
    expect(wrapper.text()).toContain('Deprecated')
    expect(wrapper.text()).toContain('Deprecated operation')
  })

  it('renders webhooks section', () => {
    const content: OpenAPIV3_1.Document = {
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      webhooks: {
        newUser: {
          post: {
            summary: 'New user webhook',
            description: 'Triggered when a new user is created',
            tags: ['webhook'],
          },
        },
      },
      paths: {},
    }
    const wrapper = mount(MarkdownReference, { props: { content } })
    expect(wrapper.text()).toContain('Webhooks')
    expect(wrapper.text()).toContain('New user webhook')
    expect(wrapper.text()).toContain('newUser')
    expect(wrapper.text()).toContain('webhook')
    expect(wrapper.text()).toContain('Triggered when a new user is created')
  })

  it('renders schemas section', () => {
    const content: OpenAPIV3_1.Document = {
      openapi: '3.1.1',
      info: { title: 'Test API', version: '1.0.0' },
      components: {
        schemas: {
          User: {
            type: 'object',
            title: 'User',
            description: 'A user object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
      paths: {},
    }
    const wrapper = mount(MarkdownReference, { props: { content } })
    expect(wrapper.text()).toContain('Schemas')
    expect(wrapper.text()).toContain('User')
    expect(wrapper.text()).toContain('A user object')
    expect(wrapper.text()).toContain('id')
    expect(wrapper.text()).toContain('name')
  })
})
