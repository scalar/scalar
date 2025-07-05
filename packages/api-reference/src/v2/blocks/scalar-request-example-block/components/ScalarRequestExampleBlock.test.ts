import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarRequestExampleBlock from './ScalarRequestExampleBlock.vue'
import { blockStore } from '@/v2/blocks/helpers/block-store'

const consoleWarnSpy = vi.spyOn(console, 'warn')
const consoleErrorSpy = vi.spyOn(console, 'error')

describe('ScalarRequestExampleBlock', () => {
  const defaultProps = {
    method: 'get',
    path: '/api/test',
    document: {
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
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('Component Rendering', () => {
    it('renders the component with basic props', async () => {
      const wrapper = mount(ScalarRequestExampleBlock, {
        props: defaultProps,
      })

      await nextTick()
      await flushPromises()

      expect(wrapper.find('[data-testid="request-example"]')).toBeTruthy()
      expect(wrapper.find('[data-testid="operation-path"]')).toBeTruthy()
    })
  })
})
