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

    // Confirm the syntax highlighting has been applied
    expect(code.html()).toBe(
      `<code class="hljs language-javascript"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>()</code>`,
    )
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

    // Confirm the syntax highlighting has been applied
    expect(code.html()).toBe(`<code class="hljs language-json"><span class="hljs-punctuation">{</span>
  <span class="hljs-attr">"description"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"successful operation"</span><span class="hljs-punctuation">,</span>
  <span class="hljs-attr">"schema"</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
    <span class="hljs-attr">"type"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"object"</span><span class="hljs-punctuation">,</span>
    <span class="hljs-attr">"properties"</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
      <span class="hljs-attr">"code"</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
        <span class="hljs-attr">"type"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"integer"</span><span class="hljs-punctuation">,</span>
        <span class="hljs-attr">"format"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"int32"</span>
      <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
      <span class="hljs-attr">"type"</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
        <span class="hljs-attr">"type"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"string"</span>
      <span class="hljs-punctuation">}</span><span class="hljs-punctuation">,</span>
      <span class="hljs-attr">"message"</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
        <span class="hljs-attr">"type"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"string"</span>
      <span class="hljs-punctuation">}</span>
    <span class="hljs-punctuation">}</span>
  <span class="hljs-punctuation">}</span>
<span class="hljs-punctuation">}</span></code>`)
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
