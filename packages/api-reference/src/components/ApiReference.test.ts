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
      expect(wrapper.html()).toContain('<!-- SingleApiReference-->')

      // Check the comment is only rendered once
      const commentCount = wrapper.html().match(/SingleApiReference/g)?.length
      expect(commentCount).toBe(1)
    })
  })

  describe('renders a select when multiple configurations are provided', () => {
    it('renders a single API reference', async () => {
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
      expect(wrapper.html()).toContain('<!-- SingleApiReference-->')
    })
  })
})
