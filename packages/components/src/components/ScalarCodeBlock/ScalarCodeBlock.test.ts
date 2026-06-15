import { type VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import ScalarCopyButton from '../ScalarCopy/ScalarCopyButton.vue'
import ScalarCodeBlock from './ScalarCodeBlock.vue'

const mockWriteText = vi.fn().mockResolvedValue(undefined)
const mockCopy = vi.fn()
const mockCopied = ref(false)

vi.mock('@vueuse/core', () => ({
  useClipboard: vi.fn(() => ({
    copy: mockCopy,
    copied: mockCopied,
  })),
}))

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
  configurable: true,
})

const createWrapper = () => {
  return mount(ScalarCodeBlock, {
    props: {
      content: 'console.log()',
      lang: 'js',
    },
  })
}

let wrapper: VueWrapper<InstanceType<typeof ScalarCodeBlock>>

beforeEach(() => {
  vi.clearAllMocks()
  mockCopied.value = false
})

describe('ScalarCodeBlock', () => {
  it('renders properly', async () => {
    wrapper = createWrapper()

    await flushPromises()

    // Check the outer elements - the pre element contains v-html with highlighted code
    const pre = wrapper.find('pre')
    expect(pre.element.nodeName.toLowerCase()).toBe('pre')

    // The highlighted code is inserted via v-html, so find the code element inside
    const code = pre.find('code')
    expect(code.exists()).toBe(true)
    expect(code.element.nodeName.toLowerCase()).toBe('code')

    // Shiki highlights asynchronously (the grammar is loaded on demand), so wait
    // for the highlighted output to replace the plain fallback
    await vi.waitFor(() => {
      expect(wrapper.find('code').classes()).toContain('language-javascript')
    })

    const highlighted = wrapper.find('code')
    expect(highlighted.classes()).toContain('scalar-code-highlight')
    // The original code is preserved as text content
    expect(highlighted.text()).toBe('console.log()')
    // Tokens are coloured via inline styles that reference Scalar's CSS variables
    expect(highlighted.html()).toContain('var(--scalar-color-')
  })

  it('renders a schema', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      props: {
        lang: 'json',
        content: {
          description: 'successful operation',
          schema: {
            type: 'object',
            properties: {
              code: {
                type: 'integer',
                format: 'int32',
              },
              type: {
                type: 'string',
              },
              message: {
                type: 'string',
              },
            },
          },
        },
      },
    })

    await flushPromises()

    // Check the outer elements - the pre element contains v-html with highlighted code
    const pre = wrapper.find('pre')
    expect(pre.element.nodeName.toLowerCase()).toBe('pre')

    // The highlighted code is inserted via v-html, so find the code element inside
    const code = pre.find('code')
    expect(code.exists()).toBe(true)
    expect(code.element.nodeName.toLowerCase()).toBe('code')

    // Shiki highlights asynchronously (the grammar is loaded on demand), so wait
    // for the highlighted output to replace the plain fallback
    await vi.waitFor(() => {
      expect(wrapper.find('code').classes()).toContain('language-json')
    })

    const highlighted = wrapper.find('code')
    expect(highlighted.classes()).toContain('scalar-code-highlight')
    // The pretty-printed JSON is preserved as text content
    expect(highlighted.text()).toContain('"description": "successful operation"')
    expect(highlighted.text()).toContain('"format": "int32"')
    // Tokens are coloured via inline styles that reference Scalar's CSS variables
    expect(highlighted.html()).toContain('var(--scalar-color-')
  })

  describe('ScalarCodeBlockCopy', () => {
    it('copies content when copy button is clicked', async () => {
      wrapper = createWrapper()

      await flushPromises()

      // Find the ScalarCopyButton component
      const copyButton = wrapper.findComponent(ScalarCopyButton)
      expect(copyButton.exists()).toBe(true)

      await copyButton.trigger('click')
      await flushPromises()

      // The copy function from useClipboard should be called with the formatted content
      // prettyPrintJson doesn't modify regular strings, so 'console.log()' stays as 'console.log()'
      expect(mockCopy).toHaveBeenCalledWith('console.log()')
    })

    it('does not render the copy button when content is null', async () => {
      wrapper = createWrapper()

      await flushPromises()

      // Check that the button is not rendered
      const button = wrapper.find('button.copy-button')
      expect(button.exists()).toBe(false)
    })
  })
})
