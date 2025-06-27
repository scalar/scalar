import { describe, expect, it } from 'vitest'

import ApiReference from '@/components/ApiReference.vue'
import { flushPromises, mount } from '@vue/test-utils'

describe('ApiReference', () => {
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

      // Check whether it renders the ApiReferenceWorkspace component only once
      expect(wrapper.findAllComponents({ name: 'ApiReferenceWorkspace' })).toHaveLength(1)
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

      // Check whether it renders the ApiReferenceWorkspace component
      expect(wrapper.findAllComponents({ name: 'ApiReferenceWorkspace' })).toHaveLength(1)
      const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })

      // Check whether it doesn't render the select
      expect(documentSelector.html()).toBe('<!--v-if-->')
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

      // Check whether it renders the ApiReferenceWorkspace component
      expect(wrapper.findAllComponents({ name: 'ApiReferenceWorkspace' })).toHaveLength(1)
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

      // Check whether it renders the ApiReferenceWorkspace component
      expect(wrapper.findAllComponents({ name: 'ApiReferenceWorkspace' })).toHaveLength(1)

      // Check whether it renders the select
      const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })
      expect(documentSelector.exists()).toBe(true)

      // Check whether it renders the names
      expect(documentSelector.html()).toContain('my-api-1')
      await documentSelector.vm.$emit('update:modelValue', 1)
      expect(documentSelector.html()).toContain('my-api-2')
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

      // Check whether it renders the select
      const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })
      expect(documentSelector.html()).not.toBe('<!--v-if-->')

      // Check whether it renders the names
      expect(documentSelector.text()).toContain('my-api-2')
      await documentSelector.vm.$emit('update:modelValue', 0)
      await wrapper.vm.$nextTick()
      expect(documentSelector.text()).toContain('my-api-1')
      wrapper.unmount()
    })
  })
})
