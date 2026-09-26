import { type VueWrapper, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import ScalarCopyButton from '../ScalarCopy/ScalarCopyButton.vue'
import ScalarCodeBlock from './ScalarCodeBlock.vue'

const mockWriteText = vi.fn().mockResolvedValue(undefined)
const mockCopy = vi.fn()
const mockCopied = ref(false)

// Keep the real module (useResizeObserver drives the tab stop) and only replace the clipboard
vi.mock('@vueuse/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vueuse/core')>()),
  useClipboard: vi.fn(() => ({
    copy: mockCopy,
    copied: mockCopied,
  })),
}))

/**
 * jsdom has no ResizeObserver, so install a stub that records the callbacks and lets a test
 * fire them by hand after faking the scroll metrics.
 */
const stubResizeObserver = () => {
  const callbacks: ResizeObserverCallback[] = []
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  return callbacks
}

/** Fakes the layout metrics jsdom never computes */
const setScrollMetrics = (
  element: Element,
  metrics: {
    scrollWidth: number
    clientWidth: number
    scrollHeight: number
    clientHeight: number
  },
) => {
  Object.defineProperties(element, {
    scrollWidth: { value: metrics.scrollWidth, configurable: true },
    clientWidth: { value: metrics.clientWidth, configurable: true },
    scrollHeight: { value: metrics.scrollHeight, configurable: true },
    clientHeight: { value: metrics.clientHeight, configurable: true },
  })
}

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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ScalarCodeBlock', () => {
  describe('keyboard access to the scroller', () => {
    it('keeps the scroller focusable and named before it is measured', async () => {
      wrapper = createWrapper()
      await flushPromises()

      const scroller = wrapper.get('.custom-scroll')
      expect(scroller.attributes('tabindex')).toBe('0')
      expect(scroller.attributes('role')).toBe('group')
      expect(scroller.attributes('aria-label')).toBe('Code sample')
    })

    it('uses the label prop as the accessible name', async () => {
      const labelled = mount(ScalarCodeBlock, {
        props: { content: 'console.log()', lang: 'js', label: 'Codebeispiel' },
      })
      await flushPromises()

      expect(labelled.get('.custom-scroll').attributes('aria-label')).toBe('Codebeispiel')
    })

    it('drops the tab stop when the code fits', async () => {
      const callbacks = stubResizeObserver()
      wrapper = createWrapper()
      await flushPromises()

      const scroller = wrapper.get('.custom-scroll')
      setScrollMetrics(scroller.element, { scrollWidth: 100, clientWidth: 100, scrollHeight: 40, clientHeight: 40 })
      callbacks[0]?.([], {} as ResizeObserver)
      await nextTick()

      expect(scroller.attributes('tabindex')).toBe('-1')
      expect(scroller.attributes('role')).toBeUndefined()
      expect(scroller.attributes('aria-label')).toBeUndefined()
    })

    it('keeps the tab stop while the code overflows and re-measures on resize', async () => {
      const callbacks = stubResizeObserver()
      wrapper = createWrapper()
      await flushPromises()

      const scroller = wrapper.get('.custom-scroll')
      setScrollMetrics(scroller.element, { scrollWidth: 300, clientWidth: 100, scrollHeight: 40, clientHeight: 40 })
      callbacks[0]?.([], {} as ResizeObserver)
      await nextTick()

      expect(scroller.attributes('tabindex')).toBe('0')
      expect(scroller.attributes('role')).toBe('group')

      // The container grew, so nothing scrolls any more
      setScrollMetrics(scroller.element, { scrollWidth: 300, clientWidth: 300, scrollHeight: 40, clientHeight: 40 })
      callbacks[0]?.([], {} as ResizeObserver)
      await nextTick()

      expect(scroller.attributes('tabindex')).toBe('-1')
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
