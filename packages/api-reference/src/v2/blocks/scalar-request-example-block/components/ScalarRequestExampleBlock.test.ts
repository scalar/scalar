import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import OperationPath from '@/components/OperationPath.vue'
import ScalarRequestExampleBlock from './ScalarRequestExampleBlock.vue'
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
  } as const

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

      await nextTick()
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
})
