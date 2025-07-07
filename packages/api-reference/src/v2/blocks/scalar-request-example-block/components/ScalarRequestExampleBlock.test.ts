import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import OperationPath from '@/components/OperationPath.vue'
import ScalarRequestExampleBlock, { type ScalarRequestExampleBlockProps } from './ScalarRequestExampleBlock.vue'
import { blockStore } from '@/v2/blocks/helpers/block-store'
import { HttpMethod } from '@/components/HttpMethod'
import { ScalarCodeBlock } from '@scalar/components'

const consoleWarnSpy = vi.spyOn(console, 'warn')
const consoleErrorSpy = vi.spyOn(console, 'error')

describe('ScalarRequestExampleBlock', () => {
  const defaultProps = {
    method: 'get',
    path: '/api/test',
    document: {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '0.0.1',
      },
      paths: {
        '/api/test': {
          get: {
            summary: 'Test operation',
          },
        },
      },
    },
  } as ScalarRequestExampleBlockProps

  beforeEach(() => {
    // Reset the block store before each test
    blockStore.selectedClient = null
  })

  afterEach(() => {
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()
  })

  describe('Component Rendering', () => {
    it('renders the component with basic props', async () => {
      const wrapper = mount(ScalarRequestExampleBlock, {
        props: defaultProps,
      })

      await flushPromises()

      // Check for the HTTP method display
      expect(wrapper.findComponent(HttpMethod).text()).toBe('get')
      // Check for the operation path
      expect(wrapper.findComponent(OperationPath).text()).toBe('/api/test')
      // Check for the code snippet container
      expect(wrapper.findComponent(ScalarCodeBlock).text()).toContain('curl http://localhost:3000/api/test')
      // Check for the client selector
      expect(wrapper.find('[data-testid="client-picker"]').text()).toBe('Shell Curl')
    })
  })

  describe('X-custom-examples', () => {
    it('pre-selects the custom example in the client picker', async () => {
      // clone the default props
      const props = structuredClone(defaultProps)
      props.name = 'x-custom'
      props.document!.paths!['/api/test'].get!['x-custom-examples'] = [
        {
          language: 'js',
          label: 'Custom Example',
          source: 'console.log("Hello, world!")',
        },
      ]

      const wrapper = mount(ScalarRequestExampleBlock, {
        props,
      })

      await flushPromises()

      expect(wrapper.findComponent(ScalarCodeBlock).text()).toContain('console.log("Hello, world!")')
      const button = wrapper.find('[data-testid="client-picker"]')
      expect(button.text()).toBe('Custom Example')
      await button.trigger('click')

      // Find and click on another client option (e.g., JavaScript Fetch)
      const dropdownOptions = document.querySelectorAll('.scalar-client-picker li')
      expect(dropdownOptions.length).toBeGreaterThan(0)

      // Select a different client (e.g., the second option if available)
      if (dropdownOptions.length > 1) {
        await Array.from(dropdownOptions)
          .find((option) => option.textContent?.includes('fetch'))
          ?.dispatchEvent(new Event('click', { bubbles: true }))

        // Verify the client has changed
        expect(wrapper.findComponent(ScalarCodeBlock).text()).not.toContain('console.log("Hello, world!")')
        expect(button.text()).toContain('fetch')
      }

      // Ensure a new component should have the newly selected client
      const wrapper2 = mount(ScalarRequestExampleBlock, {
        props: defaultProps,
      })

      await flushPromises()

      expect(wrapper2.findComponent(ScalarCodeBlock).text()).toContain('fetch')
      expect(wrapper2.find('[data-testid="client-picker"]').text()).toContain('fetch')
    })
  })
})
