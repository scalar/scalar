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
  it('mounts a window of source lines and copies the complete document after scrolling', async () => {
    const content = Array.from({ length: 250 }, (_, index) => `value ${index + 1}`).join('\n')
    const wrapper = mount(ScalarCodeBlock, {
      props: { prettyPrintedContent: content, virtualize: true, lineNumbers: true },
    })
    try {
      const region = wrapper.get<HTMLElement>('[role="group"]')
      expect(region.text()).toContain('value 1')
      expect(region.text()).not.toContain('value 250')

      region.element.scrollTop = 249 * 24
      await region.trigger('scroll')
      expect(region.text()).toContain('value 250')
      expect(region.text()).not.toContain('value 1')

      await wrapper.get('button[aria-label="Copy Plain Text code"]').trigger('click')
      expect(mockCopy).toHaveBeenLastCalledWith(content)
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps a long minified response readable without mounting its tokens', async () => {
    const content = '<p>one</p>'.repeat(1024)
    const wrapper = mount(ScalarCodeBlock, {
      props: { prettyPrintedContent: content, lang: 'html', virtualize: true, lineNumbers: true },
    })
    try {
      expect(wrapper.get('code').text()).toBe(`1${content}`)
      expect(wrapper.findAll('code span').length).toBeLessThan(10)
      await wrapper.get('button[aria-label="Copy code"]').trigger('click')
      expect(mockCopy).toHaveBeenLastCalledWith(content)
    } finally {
      wrapper.unmount()
    }
  })

  it('returns focus to the scroller when a virtual fold button leaves the viewport', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      attachTo: document.body,
      props: {
        prettyPrintedContent: 'a {\n  color: red;\n}\n'.repeat(100),
        lang: 'css',
        foldable: true,
        virtualize: true,
      },
    })
    try {
      const selector = 'button[aria-label="Toggle code fold at line 1"]'
      const region = wrapper.get<HTMLElement>('[role="group"]')
      wrapper.get<HTMLElement>(selector).element.focus()
      expect(document.activeElement).toBe(wrapper.get(selector).element)

      region.element.scrollTop = 290 * 24
      await region.trigger('scroll')
      expect(wrapper.find(selector).exists()).toBe(false)
      expect(document.activeElement).toBe(region.element)
    } finally {
      wrapper.unmount()
    }
  })

  it('gives the fold buttons one tab stop and navigates past an offscreen gap', async () => {
    const wrapper = mount(ScalarCodeBlock, {
      attachTo: document.body,
      props: {
        prettyPrintedContent: `a {\n  color: red;\n}\n${'\n'.repeat(20)}b {\n  color: blue;\n}${'\n'.repeat(100)}`,
        lang: 'css',
        foldable: true,
        virtualize: true,
      },
    })
    try {
      await flushPromises()
      const firstSelector = 'button[aria-label="Toggle code fold at line 1"]'
      const lastSelector = 'button[aria-label="Toggle code fold at line 24"]'
      const first = wrapper.get<HTMLButtonElement>(firstSelector)
      expect(first.attributes('tabindex')).toBe('0')
      expect(wrapper.find(lastSelector).exists()).toBe(false)

      first.element.focus()
      await first.trigger('keydown', { key: 'ArrowDown' })
      const last = wrapper.get(lastSelector)
      expect(document.activeElement).toBe(last.element)
      expect(last.attributes('tabindex')).toBe('0')

      await last.trigger('keydown', { key: 'ArrowUp' })
      expect(document.activeElement).toBe(wrapper.get(firstSelector).element)
    } finally {
      wrapper.unmount()
    }
  })

  it('reveals collapsed rows when folding is disabled', async () => {
    const content = 'a {\n  color: red;\n}\n'.repeat(100)
    const wrapper = mount(ScalarCodeBlock, {
      props: { prettyPrintedContent: content, lang: 'css', foldable: true, virtualize: true },
    })
    try {
      const code = wrapper.get('code')
      await wrapper.get('button[aria-label="Toggle code fold at line 1"]').trigger('click')
      expect(code.find('[data-code-line="1"]').exists()).toBe(false)
      await wrapper.setProps({ foldable: false })
      expect(code.get('[data-code-line="1"]').text()).toBe('color: red;')
    } finally {
      wrapper.unmount()
    }
  })

  it('toggles a nested fold and copies the full source while collapsed', async () => {
    const content = '{\n  "items": [\n    123\n  ]\n}'
    const wrapper = mount(ScalarCodeBlock, {
      attachTo: document.body,
      props: { prettyPrintedContent: content, lang: 'json', lineNumbers: true, foldable: true },
    })
    try {
      const toggle = wrapper.get<HTMLButtonElement>('button[aria-label="Toggle code fold at line 2"]')
      toggle.element.focus()
      expect(wrapper.get('code').text()).toContain('123')

      await toggle.trigger('click')
      expect(document.activeElement).toBe(toggle.element)
      expect(toggle.attributes('aria-expanded')).toBe('false')
      expect(wrapper.get('code').text()).not.toContain('123')

      await wrapper.get('button[aria-label="Copy JSON code"]').trigger('click')
      expect(mockCopy).toHaveBeenLastCalledWith(content)

      await toggle.trigger('click')
      expect(toggle.attributes('aria-expanded')).toBe('true')
      expect(wrapper.get('code').text()).toContain('123')
    } finally {
      wrapper.unmount()
    }
  })

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
