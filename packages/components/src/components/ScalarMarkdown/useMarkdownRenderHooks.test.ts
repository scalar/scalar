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
    expect(contexts.map((context) => context.source)).toStrictEqual(['<script>alert(1)</script>\n\nFirst'])
    expect(contexts[0]!.element).toBe(wrapper.element)
    expect(contexts[0]!.signal.aborted).toBe(false)
    await wrapper.setProps({ value: 'Second' })
    await flushPromises()
    expect(contexts.map((context) => context.source)).toStrictEqual(['<script>alert(1)</script>\n\nFirst', 'Second'])
    expect(contexts[1]!.element).toBe(wrapper.element)
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

  it('disposes a cancelled async rendering without disposing its replacement', async () => {
    let finish: ((cleanup: () => void) => void) | undefined
    const first = new Promise<() => void>((resolve) => {
      finish = resolve
    })
    const firstCleanup = vi.fn()
    const secondCleanup = vi.fn()
    const contexts: Parameters<MarkdownRenderHook>[0][] = []
    const hook: MarkdownRenderHook = (context) => {
      contexts.push(context)
      return context.source === 'First' ? first : secondCleanup
    }
    const wrapper = mount(ScalarMarkdown, {
      props: { value: 'First' },
      global: { provide: { [MARKDOWN_RENDER_HOOKS as symbol]: [hook] } },
    })
    await flushPromises()
    await wrapper.setProps({ value: 'Second' })
    await flushPromises()
    expect(contexts.map(({ signal }) => signal.aborted)).toStrictEqual([true, false])
    finish?.(firstCleanup)
    await flushPromises()
    expect(firstCleanup).toHaveBeenCalledTimes(1)
    expect(secondCleanup).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(firstCleanup).toHaveBeenCalledTimes(1)
    expect(secondCleanup).toHaveBeenCalledTimes(1)
  })

  it('releases other plugins when a cleanup callback throws', async () => {
    const cleanup = vi.fn()
    const failure = new Error('Cleanup failed')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const hooks: MarkdownRenderHook[] = [
      () => cleanup,
      () => () => {
        throw failure
      },
    ]
    const wrapper = mount(ScalarMarkdown, {
      props: { value: 'First' },
      global: { provide: { [MARKDOWN_RENDER_HOOKS as symbol]: hooks } },
    })
    try {
      await flushPromises()
      await wrapper.setProps({ value: 'Second' })
      await flushPromises()
      expect(cleanup).toHaveBeenCalledTimes(1)
      expect(error).toHaveBeenCalledWith('Could not dispose Markdown enhancement:', failure)
      wrapper.unmount()
      expect(cleanup).toHaveBeenCalledTimes(2)
      expect(error).toHaveBeenCalledTimes(2)
    } finally {
      error.mockRestore()
    }
  })
})
