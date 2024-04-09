import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarCodeBlock from './ScalarCodeBlock.vue'

describe('ScalarCodeBlock', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      attrs: {
        content: 'console.log()',
      },
    })

    await flushPromises()

    // Check the outer elements
    const pre = wrapper.find('*')
    const code = pre.find('code')

    expect(pre.element.nodeName.toLowerCase()).toBe('pre')
    expect(code.element.nodeName.toLowerCase()).toBe('code')

    // Confirm the syntax highlighting has been applied
    expect(code.html()).toBe(
      `<code class="scalar-codeblock-code language-js">console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token punctuation">)</span></code>`,
    )
  })

  it('renders a schema', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      attrs: {
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
    const pre = wrapper.find('*')
    const code = pre.find('code')

    expect(pre.element.nodeName.toLowerCase()).toBe('pre')
    expect(code.element.nodeName.toLowerCase()).toBe('code')

    // Confirm the syntax highlighting has been applied
    expect(code.html())
      .toBe(`<code class="scalar-codeblock-code language-js"><span class="token punctuation">{</span>
  <span class="token string-property property">"description"</span><span class="token operator">:</span> <span class="token string">"successful operation"</span><span class="token punctuation">,</span>
  <span class="token string-property property">"schema"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
    <span class="token string-property property">"type"</span><span class="token operator">:</span> <span class="token string">"object"</span><span class="token punctuation">,</span>
    <span class="token string-property property">"properties"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
      <span class="token string-property property">"code"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
        <span class="token string-property property">"type"</span><span class="token operator">:</span> <span class="token string">"integer"</span><span class="token punctuation">,</span>
        <span class="token string-property property">"format"</span><span class="token operator">:</span> <span class="token string">"int32"</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token string-property property">"type"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
        <span class="token string-property property">"type"</span><span class="token operator">:</span> <span class="token string">"string"</span>
      <span class="token punctuation">}</span><span class="token punctuation">,</span>
      <span class="token string-property property">"message"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
        <span class="token string-property property">"type"</span><span class="token operator">:</span> <span class="token string">"string"</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></code>`)
  })
})
