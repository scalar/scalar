import { grammarFor } from '@scalar/highlight/compat'
import { type VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { preloadGrammars } from '@/helpers/load-grammar'

import ScalarCopyButton from '../ScalarCopy/ScalarCopyButton.vue'
import ScalarCodeBlock from './ScalarCodeBlock.vue'

// Wraps the real loader so tests can count downloads while grammars still load for real
vi.mock('@scalar/highlight/lazy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scalar/highlight/lazy')>()
  return { ...actual, loadLanguage: vi.fn(actual.loadLanguage) }
})

const { loadLanguage } = await import('@scalar/highlight/lazy')

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
  it('copies an explicit original value while displaying masked content', async () => {
    const wrapper = mount(ScalarCodeBlock, { props: { content: 'token = "••••••••"', copyContent: 'token = "ab"' } })
    expect(wrapper.get('[role="group"]').text()).toBe('token = "••••••••"')
    await wrapper.get('button').trigger('click')
    expect(mockCopy).toHaveBeenLastCalledWith('token = "ab"')
    await wrapper.setProps({ copyContent: '' })
    await wrapper.get('button').trigger('click')
    expect(mockCopy).toHaveBeenLastCalledWith('')
  })

  it('names the code region while keeping it keyboard-scrollable', async () => {
    const wrapper = createWrapper()
    const region = wrapper.get('[role="group"]')

    expect(region.attributes('aria-label')).toBe('Code sample')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.text()).toBe('console.log()')

    await wrapper.setProps({ label: 'Request example' })
    expect(region.attributes('aria-label')).toBe('Request example')
  })

  it.each([
    ['console.log()', 'Copy code'],
    ['console.log()\nconsole.log()', 'Copy js code'],
  ])('keeps a descriptive copy name for %j', async (content, copyName) => {
    const wrapper = mount(ScalarCodeBlock, { props: { content, lang: 'js' } })
    const button = wrapper.get('button')

    expect(button.attributes('aria-label')).toBe(copyName)
    await button.trigger('click')
    expect(mockCopy).toHaveBeenCalledWith(content)

    mockCopied.value = true
    await flushPromises()

    expect(button.attributes('aria-label')).toBe(copyName)
    expect(wrapper.get('[role="alert"]').text()).toBe('Copied')
  })
  describe('keyboard access to the scroller', () => {
    it('uses the label prop as the accessible name', async () => {
      const labelled = mount(ScalarCodeBlock, {
        props: { content: 'console.log()', lang: 'js', label: 'Codebeispiel' },
      })
      await flushPromises()

      expect(labelled.get('.custom-scroll').attributes('aria-label')).toBe('Codebeispiel')
    })

    it('keeps the copy button outside the scroll region', async () => {
      wrapper = createWrapper()
      await flushPromises()

      // A focusable control inside the scroller could be focused while scrolled out of view
      const copyButton = wrapper.findComponent(ScalarCopyButton)
      expect(wrapper.get('.custom-scroll').element.contains(copyButton.element)).toBe(false)
    })
  })

  it('renders properly', async () => {
    wrapper = createWrapper()

    await flushPromises()

    // JavaScript and JSON are bundled, so they highlight without waiting for a download
    expect(wrapper.get('code').html()).toContain('hljs-')

    // Check the outer elements - the pre element contains v-html with highlighted code
    const pre = wrapper.find('pre')
    expect(pre.element.nodeName.toLowerCase()).toBe('pre')

    // The highlighted code is inserted via v-html, so find the code element inside
    const code = pre.find('code')
    expect(code.exists()).toBe(true)
    expect(code.element.nodeName.toLowerCase()).toBe('code')

    // Confirm the syntax highlighting has been applied
    expect(code.html()).toBe(
      `<code class="hljs language-javascript"><span class="hljs-variable">console</span><span class="hljs-punctuation">.</span><span class="hljs-title function_">log</span><span class="hljs-punctuation">()</span></code>`,
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

    // JavaScript and JSON are bundled, so they highlight without waiting for a download
    expect(wrapper.get('code').html()).toContain('hljs-')

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
      <span class="hljs-punctuation">},</span>
      <span class="hljs-attr">"type"</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
        <span class="hljs-attr">"type"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"string"</span>
      <span class="hljs-punctuation">},</span>
      <span class="hljs-attr">"message"</span><span class="hljs-punctuation">:</span> <span class="hljs-punctuation">{</span>
        <span class="hljs-attr">"type"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"string"</span>
      <span class="hljs-punctuation">}</span>
    <span class="hljs-punctuation">}</span>
  <span class="hljs-punctuation">}</span>
<span class="hljs-punctuation">}</span></code>`)
  })

  describe('loading grammars on demand', () => {
    it('starts one download for many blocks in the same language', async () => {
      // Grammars stay loaded for the whole file, so check nothing loaded Lua already
      expect(grammarFor('lua')).toBeUndefined()
      const blocks = Array.from({ length: 5 }, (_, index) =>
        mount(ScalarCodeBlock, { props: { content: `local n = ${index}`, lang: 'lua' } }),
      )

      await vi.waitFor(() => {
        for (const block of blocks) {
          expect(block.get('code').html()).toContain('hljs-keyword')
        }
      })
      expect(vi.mocked(loadLanguage).mock.calls.filter(([name]) => name === 'lua')).toHaveLength(1)
    })

    it('highlights on the first render when the grammar was preloaded', async () => {
      // Only the preload can load Ruby, so check nothing loaded it already
      expect(grammarFor('ruby')).toBeUndefined()
      await preloadGrammars(['ruby'])

      wrapper = mount(ScalarCodeBlock, { props: { content: 'puts 1', lang: 'ruby' } })

      expect(wrapper.get('code').html()).toContain('hljs-number')
    })

    it('stays highlighted when the content changes but the language does not', async () => {
      wrapper = mount(ScalarCodeBlock, { props: { content: 'const a = 1', lang: 'javascript' } })
      await vi.waitFor(() => expect(wrapper.get('code').html()).toContain('hljs-keyword'))

      await wrapper.setProps({ content: 'const b = 2' })

      // Synchronously, with no plain-text frame in between
      expect(wrapper.get('code').html()).toContain('hljs-keyword')
      expect(wrapper.get('code').text()).toBe('const b = 2')
    })

    it('renders highlighted markup on the server for a grammar that was not loaded', async () => {
      // The server render has to wait for Swift, so check nothing loaded it already
      expect(grammarFor('swift')).toBeUndefined()
      const html = await renderToString(
        createSSRApp({ render: () => h(ScalarCodeBlock, { content: 'let x = 1', lang: 'swift' }) }),
      )

      expect(html).toContain('<span class="hljs-keyword">let</span>')
    })

    it('does not try to load plain text or unknown languages', async () => {
      vi.mocked(loadLanguage).mockClear()

      mount(ScalarCodeBlock, { props: { content: 'x', lang: 'plaintext' } })
      mount(ScalarCodeBlock, { props: { content: 'x', lang: 'not-a-language' } })
      await flushPromises()

      expect(loadLanguage).not.toHaveBeenCalled()
    })

    it('renders plain text first and highlights once the grammar has loaded', async () => {
      // Grammars stay loaded for the whole file, so check nothing loaded Python already
      expect(grammarFor('python')).toBeUndefined()
      wrapper = mount(ScalarCodeBlock, { props: { content: 'def greet(): pass', lang: 'python' } })

      expect(wrapper.get('code').html()).toBe('<code class="hljs language-python">def greet(): pass</code>')

      await vi.waitFor(() => expect(wrapper.get('code').html()).toContain('hljs-keyword'))
      expect(wrapper.get('code').text()).toBe('def greet(): pass')
    })

    it('highlights a capitalised language name with a bounded number of loads', async () => {
      vi.mocked(loadLanguage).mockClear()
      // `x-codeSamples` passes `lang` through as written, so `Node` reaches the block as is
      wrapper = mount(ScalarCodeBlock, { props: { content: 'const a = 1', lang: 'Node' } })

      await vi.waitFor(() => expect(wrapper.get('code').html()).toContain('hljs-keyword'))
      await flushPromises()

      expect(vi.mocked(loadLanguage).mock.calls.length).toBeLessThanOrEqual(1)
    })

    it('loads the grammar for an alias', async () => {
      wrapper = mount(ScalarCodeBlock, { props: { content: 'fn main() {}', lang: 'rs' } })

      await vi.waitFor(() => expect(wrapper.get('code').html()).toContain('hljs-keyword'))
      expect(wrapper.get('code').classes()).toContain('language-rs')
    })

    it('loads the grammar for a language it switches to', async () => {
      wrapper = mount(ScalarCodeBlock, { props: { content: 'SELECT 1', lang: 'plaintext' } })
      expect(wrapper.get('code').html()).toBe('<code class="hljs language-plaintext">SELECT 1</code>')

      await wrapper.setProps({ lang: 'sql' })

      await vi.waitFor(() => expect(wrapper.get('code').html()).toContain('hljs-keyword'))
    })

    it('leaves a language without a grammar as escaped plain text', async () => {
      wrapper = mount(ScalarCodeBlock, { props: { content: '<b>bold</b>', lang: 'not-a-language' } })
      await flushPromises()

      expect(wrapper.get('code').html()).toBe(
        '<code class="hljs language-not-a-language">&lt;b&gt;bold&lt;/b&gt;</code>',
      )
    })
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

    it('names the copy button after the language it copies', async () => {
      wrapper = mount(ScalarCodeBlock, {
        props: { content: 'line one\nline two', lang: 'javascript' },
      })
      await flushPromises()

      const button = wrapper.findComponent(ScalarCopyButton).get('button')
      expect(button.attributes('aria-label')).toBe('Copy JavaScript code')
      // The visible word stays part of the name (WCAG 2.5.3)
      expect(button.text()).toContain('Copy')
    })

    it('uses a plain name for a one-line block that shows no language', async () => {
      wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.findComponent(ScalarCopyButton).get('button').attributes('aria-label')).toBe('Copy code')
    })

    it('forwards a localized copy label', async () => {
      wrapper = mount(ScalarCodeBlock, {
        props: { content: 'console.log()', lang: 'js', copyLabel: 'Code kopieren' },
      })
      await flushPromises()

      expect(wrapper.findComponent(ScalarCopyButton).get('button').attributes('aria-label')).toBe('Code kopieren')
    })
  })
})
