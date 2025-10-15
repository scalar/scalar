import { renderToString } from '@vue/server-renderer'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'

import ApiReference from '@/components/ApiReference.vue'

// Mock window.location for all tests
const mockLocation = {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  ancestorOrigins: {} as DOMStringList,
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn(),
  toString: () => 'http://localhost:3000/',
}

beforeEach(() => {
  vi.resetAllMocks()
  // Reset location mock before each test
  mockLocation.href = 'http://localhost:3000/'
  mockLocation.pathname = '/'
  mockLocation.search = ''
  mockLocation.hash = ''

  vi.stubGlobal('location', mockLocation)
})

describe('multiple configurations', () => {
  it('renders a single API reference', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: {
          content: {
            openapi: '3.1.0',
            info: {
              title: 'My API',
              version: '1.0.0',
            },
            paths: {
              '/api/v1/users': {
                get: {
                  summary: 'Get users',
                },
              },
            },
          },
        },
      },
    })

    // Wait for the API reference to be rendered
    await wrapper.vm.$nextTick()

    // Check whether it renders the ApiReferenceLayout component only once
    expect(wrapper.findAllComponents({ name: 'ApiReferenceLayout' })).toHaveLength(1)
    wrapper.unmount()
  })

  it(`doesn't render the select when there is only one configuration`, async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: [
          {
            content: {
              openapi: '3.1.0',
              info: {
                title: 'My API',
                version: '1.0.0',
              },
            },
          },
        ],
      },
    })

    // Wait for the API reference to be rendered
    await wrapper.vm.$nextTick()

    // Check whether it renders the ApiReferenceLayout component
    expect(wrapper.findAllComponents({ name: 'ApiReferenceLayout' })).toHaveLength(1)
    const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })

    // Check whether it doesn't render the select
    expect(documentSelector.exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders a select when multiple configurations are provided', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: [
          {
            content: {
              openapi: '3.1.0',
              info: {
                title: 'My API #1',
                version: '1.0.0',
              },
            },
          },
          {
            content: {
              openapi: '3.1.0',
              info: {
                title: 'My API #2',
                version: '1.0.0',
              },
            },
          },
        ],
      },
    })

    // Wait for the API reference to be rendered
    await wrapper.vm.$nextTick()

    // Check whether it renders the ApiReferenceLayout component
    expect(wrapper.findAllComponents({ name: 'ApiReferenceLayout' })).toHaveLength(1)
    const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })

    // Ensure the select is rendered
    expect(documentSelector.html()).not.toBe('<!--v-if-->')
    wrapper.unmount()
  })

  it('renders a select with the names', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: [
          {
            slug: 'my-api-1',
            content: {
              openapi: '3.1.0',
              info: {
                title: 'My API #1',
                version: '1.0.0',
              },
            },
          },
          {
            slug: 'my-api-2',
            content: {
              openapi: '3.1.0',
              info: {
                title: 'My API #2',
                version: '1.0.0',
              },
            },
          },
        ],
      },
    })

    // Wait for the API reference to be rendered
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Check whether it renders the ApiReferenceLayout component
    expect(wrapper.findAllComponents({ name: 'ApiReferenceLayout' })).toHaveLength(1)

    // Check whether it renders the select
    const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })
    expect(documentSelector.exists()).toBe(true)

    // Check whether it renders the names
    expect(documentSelector.html()).toContain('my-api-1')
    await documentSelector.vm.$emit('update:modelValue', 'my-api-2')
    expect(documentSelector.html()).toContain('my-api-2')
    wrapper.unmount()
  })
})

describe('circular documents', () => {
  it('handles circular references in schemas gracefully', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: {
          content: {
            openapi: '3.0.1',
            info: {
              title: 'API with Circular Dependencies',
              version: '1.0.0',
            },
            components: {
              schemas: {
                Base: {
                  required: ['Type'],
                  type: 'object',
                  anyOf: [{ $ref: '#/components/schemas/Derived1' }, { $ref: '#/components/schemas/Derived2' }],
                  discriminator: {
                    propertyName: 'Type',
                    mapping: {
                      'Value1': '#/components/schemas/Derived1',
                      'Value2': '#/components/schemas/Derived2',
                    },
                  },
                },
                Derived1: {
                  properties: {
                    Type: {
                      enum: ['Value1'],
                      type: 'string',
                    },
                  },
                },
                Derived2: {
                  required: ['Ref'],
                  properties: {
                    Type: {
                      enum: ['Value2'],
                      type: 'string',
                    },
                    Ref: {
                      $ref: '#/components/schemas/Base',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Wait for the API reference to be rendered
    // await flushPromises()
    await wrapper.vm.$nextTick()

    // Check whether it renders the ApiReferenceLayout component
    expect(wrapper.findAllComponents({ name: 'ApiReferenceLayout' })).toHaveLength(1)

    // Verify the component doesn't crash or throw errors when processing circular references
    expect(wrapper.exists()).toBe(true)

    // Check that the component is still functional despite circular dependencies
    const ApiReferenceLayout = wrapper.findComponent({ name: 'ApiReferenceLayout' })
    expect(ApiReferenceLayout.exists()).toBe(true)

    wrapper.unmount()
  })
})

describe('multiple sources', () => {
  it('renders two URLs', async () => {
    const wrapper = mount(ApiReference, {
      props: {
        configuration: {
          sources: [
            {
              url: 'https://api.example.com/v1/openapi.yaml',
              slug: 'my-api-1',
              default: true,
            },
            {
              url: 'https://api.example.com/v2/openapi.yaml',
              slug: 'my-api-2',
            },
          ],
        },
      },
    })

    // Wait for the API reference to be rendered
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Check whether it renders the select
    const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })
    expect(documentSelector.exists()).toBe(true)
    await documentSelector.find('button').trigger('click')

    // Check whether it renders the names
    expect(documentSelector.text()).toContain('my-api-2')
    await documentSelector.vm.$emit('update:modelValue', 'my-api-1')
    await wrapper.vm.$nextTick()
    expect(documentSelector.text()).toContain('my-api-1')
    wrapper.unmount()
  })
})

describe('Rendering', () => {
  it('has the title in the HTML output', async () => {
    const document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    }

    const app = createSSRApp({
      render: () =>
        h(ApiReference, {
          configuration: {
            content: document,
          },
        }),
    })

    const html = await renderToString(app)

    expect(html).toContain('Test API')
  })
})
