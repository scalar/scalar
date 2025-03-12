import { describe, expect, it } from 'vitest'

import ApiReference from '@/components/ApiReference.vue'
import { flushPromises, mount } from '@vue/test-utils'

describe('ApiReference', () => {
  describe('multiple configurations', () => {
    it('renders a single API reference', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            spec: {
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
        },
      })

      // Wait for the API reference to be rendered
      await wrapper.vm.$nextTick()

      // Check whether it renders the SingleApiReference component only once
      expect(wrapper.findAllComponents({ name: 'SingleApiReference' })).toHaveLength(1)
    })

    it('doesn’t render the select when there is only one configuration', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: [
            {
              spec: {
                content: {
                  openapi: '3.1.0',
                  info: {
                    title: 'My API',
                    version: '1.0.0',
                  },
                },
              },
            },
          ],
        },
      })

      // Wait for the API reference to be rendered
      await wrapper.vm.$nextTick()

      // Check whether it renders the SingleApiReference component
      expect(wrapper.findAllComponents({ name: 'SingleApiReference' })).toHaveLength(1)

      // Check whether it doesn’t render the select
      expect(wrapper.findAllComponents({ name: 'DocumentSelector' })).toHaveLength(0)
    })

    it('renders a select when multiple configurations are provided', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: [
            {
              spec: {
                content: {
                  openapi: '3.1.0',
                  info: {
                    title: 'My API #1',
                    version: '1.0.0',
                  },
                },
              },
            },
            {
              spec: {
                content: {
                  openapi: '3.1.0',
                  info: {
                    title: 'My API #2',
                    version: '1.0.0',
                  },
                },
              },
            },
          ],
        },
      })

      // Wait for the API reference to be rendered
      await wrapper.vm.$nextTick()

      // Check whether it renders the SingleApiReference component
      expect(wrapper.findAllComponents({ name: 'SingleApiReference' })).toHaveLength(1)
    })

    it('renders a select with the names', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: [
            {
              spec: {
                slug: 'my-api-1',
                content: {
                  openapi: '3.1.0',
                  info: {
                    title: 'My API #1',
                    version: '1.0.0',
                  },
                },
              },
            },
            {
              spec: {
                slug: 'my-api-2',
                content: {
                  openapi: '3.1.0',
                  info: {
                    title: 'My API #2',
                    version: '1.0.0',
                  },
                },
              },
            },
          ],
        },
      })

      // Wait for the API reference to be rendered
      await flushPromises()

      // Check whether it renders the SingleApiReference component
      expect(wrapper.findAllComponents({ name: 'SingleApiReference' })).toHaveLength(1)

      // Check whether it renders the select
      const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })
      expect(documentSelector.exists()).toBe(true)

      // Check whether it renders the names
      expect(documentSelector.html()).toContain('my-api-1')
      await documentSelector.vm.$emit('update:modelValue', 1)
      expect(documentSelector.html()).toContain('my-api-2')
    })
  })

  describe('multiple sources', () => {
    it('renders two URLs', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: {
            spec: {
              sources: [
                {
                  url: 'https://api.example.com/v1/openapi.yaml',
                  slug: 'my-api-1',
                },
                {
                  url: 'https://api.example.com/v2/openapi.yaml',
                  slug: 'my-api-2',
                },
              ],
            },
          },
        },
      })

      // Wait for the API reference to be rendered
      await flushPromises()

      // Check whether it renders the select
      const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })
      expect(documentSelector.exists()).toBe(true)

      // Check whether it renders the names
      expect(wrapper.html()).toContain('my-api-1')
      await documentSelector.vm.$emit('update:modelValue', 1)
      await wrapper.vm.$nextTick()
      expect(wrapper.html()).toContain('my-api-2')
    })
  })
})
