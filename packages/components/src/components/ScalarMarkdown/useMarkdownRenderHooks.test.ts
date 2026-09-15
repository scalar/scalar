import type { MarkdownRenderHook } from '@scalar/helpers/markdown/markdown-render-hook'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarMarkdown from './ScalarMarkdown.vue'
import ScalarMarkdownSummary from './ScalarMarkdownSummary.vue'
import { MARKDOWN_RENDER_HOOKS } from './useMarkdownRenderHooks'

describe('useMarkdownRenderHooks', () => {
  it('enhances sanitized content and cancels each rendering before replacement or unmount', async () => {
    const contexts: Parameters<MarkdownRenderHook>[0][] = []
    const cleanup = vi.fn()
    const hook: MarkdownRenderHook = (context) => {
      contexts.push(context)
      expect(context.element.querySelector('script')).toBeNull()
      return cleanup
    }
    const wrapper = mount(ScalarMarkdown, {
      props: { value: '<script>alert(1)</script>\n\nFirst' },
      global: { provide: { [MARKDOWN_RENDER_HOOKS as symbol]: [hook] } },
    })
    await flushPromises()
    expect(contexts).toHaveLength(1)
    expect(contexts[0]!.signal.aborted).toBe(false)
    await wrapper.setProps({ value: 'Second' })
    await flushPromises()
    expect(contexts).toHaveLength(2)
    expect(contexts[0]!.signal.aborted).toBe(true)
    expect(contexts[1]!.source).toBe('Second')
    expect(cleanup).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(contexts[1]!.signal.aborted).toBe(true)
    expect(cleanup).toHaveBeenCalledTimes(2)
  })

  it('disposes late async enhancements after unmount', async () => {
    let finish: ((cleanup: () => void) => void) | undefined
    const cleanup = vi.fn()
    const hook: MarkdownRenderHook = () =>
      new Promise((resolve) => {
        finish = resolve
      })
    const wrapper = mount(ScalarMarkdown, {
      props: { value: 'First' },
      global: { provide: { [MARKDOWN_RENDER_HOOKS as symbol]: [hook] } },
    })
    await flushPromises()
    wrapper.unmount()
    finish?.(cleanup)
    await flushPromises()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('applies hooks to summaries while leaving other instances untouched', async () => {
    const hook = vi.fn()
    const summary = mount(ScalarMarkdownSummary, {
      props: { value: 'Summary' },
      global: { provide: { [MARKDOWN_RENDER_HOOKS as symbol]: [hook] } },
    })
    const plain = mount(ScalarMarkdown, { props: { value: '```mermaid\ngraph LR; A-->B\n```' } })
    await flushPromises()
    expect(hook).toHaveBeenCalledTimes(1)
    expect(plain.get('pre code').text()).toBe('graph LR; A-->B')
    summary.unmount()
    plain.unmount()
  })
})
