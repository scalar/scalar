import { describe, expect, it } from 'vitest'

import ApiReference from '@/components/ApiReference.vue'
import { mount } from '@vue/test-utils'

describe('ApiReference', () => {
  describe('multiple API definitions', () => {
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

      // Check whether it renders the SingleApiReference component
      expect(wrapper.html()).toContain('<!-- SingleApiReference -->')

      // Check the comment is only rendered once
      const commentCount = wrapper.html().match(/SingleApiReference/g)?.length
      expect(commentCount).toBe(1)
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
      expect(wrapper.html()).toContain('<!-- SingleApiReference -->')

      // Check whether it doesn’t render the select
      expect(wrapper.html()).not.toContain('document-selector')
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
      expect(wrapper.html()).toContain('<!-- SingleApiReference -->')
    })

    it('renders a select with the names', async () => {
      const wrapper = mount(ApiReference, {
        props: {
          configuration: [
            {
              spec: {
                name: 'my-api-1',
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
                name: 'my-api-2',
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
      expect(wrapper.html()).toContain('<!-- SingleApiReference -->')

      // Check whether it renders the select
      expect(wrapper.html()).toContain('document-selector')

      // Check whether it renders the names
      expect(wrapper.html()).toContain('my-api-1')
      expect(wrapper.html()).toContain('my-api-2')
    })
  })
})
