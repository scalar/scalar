import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'

import ScalarCodeBlock from './ScalarCodeBlock.vue'

const mockCopyToClipboard = vi.fn()

vi.mock('@scalar/use-hooks/useClipboard', () => ({
  useClipboard: vi.fn(() => ({
    copyToClipboard: mockCopyToClipboard,
  })),
}))

const createWrapper = () => {
  return mount(ScalarCodeBlock, {
    attrs: {
      content: 'console.log()',
      lang: 'js',
    },
  })
}

let wrapper: VueWrapper<InstanceType<typeof ScalarCodeBlock>>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ScalarCodeBlock', () => {
  it('renders properly', async () => {
    wrapper = createWrapper()

    await flushPromises()

    // Check the outer elements
    const pre = wrapper.find('pre.scalar-codeblock-pre')
    const code = pre.find('code')

    expect(pre.element.nodeName.toLowerCase()).toBe('pre')
    expect(code.element.nodeName.toLowerCase()).toBe('code')

    // Confirm the syntax highlighting has been applied
    expect(code.html()).toBe(
      `<code class="hljs language-javascript"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>()</code>`,
    )
  })

  it('renders a schema', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      attrs: {
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

    // Check the outer elements
    const pre = wrapper.find('pre.scalar-codeblock-pre')
    const code = pre.find('code')

    expect(pre.element.nodeName.toLowerCase()).toBe('pre')
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

      const copyButton = wrapper.find('.scalar-code-copy')
      expect(copyButton.exists()).toBe(true)

      const button = copyButton.find('button')
      expect(button.exists()).toBe(true)

      await button.trigger('click')

      expect(mockCopyToClipboard).toHaveBeenCalledWith(prettyPrintJson(wrapper.vm.content))
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
