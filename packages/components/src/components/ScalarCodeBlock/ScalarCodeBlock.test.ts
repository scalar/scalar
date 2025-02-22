import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarCodeBlock from './ScalarCodeBlock.vue'

describe('ScalarCodeBlock', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      attrs: {
        content: 'console.log()',
        lang: 'js',
      },
    })

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

  it('does not render the copy button when content is null', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      attrs: {
        content: null,
        lang: 'js',
      },
    })

    await flushPromises()

    // Check that the button is not rendered
    const button = wrapper.find('button.copy-button')
    expect(button.exists()).toBe(false)
  })

  it('does not render the copy button when content is "null"', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      attrs: {
        content: 'null',
        lang: 'js',
      },
    })

    await flushPromises()

    // Check that the button is not rendered
    const button = wrapper.find('button.copy-button')
    expect(button.exists()).toBe(false)
  })
})
