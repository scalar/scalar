import { initializeToasts } from '@scalar/use-toasts'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import CopyMarkdownButton from './CopyMarkdownButton.vue'

const document = coerceValue(OpenAPIDocumentSchema, {
  openapi: '3.1.1',
  info: { title: 'Example API', version: '1' },
  paths: {
    '/pets': {
      get: { summary: 'List pets', responses: { '200': { description: 'OK' } } },
      post: { summary: 'Create pet', responses: { '201': { description: 'Created' } } },
    },
  },
})
const props = { document, path: '/pets', method: 'get', isWebhook: false } as const

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  initializeToasts(() => null)
})

describe('CopyMarkdownButton', () => {
  it('copies the selected operation and resets the confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('ClipboardItem', undefined)
    const wrapper = mount(CopyMarkdownButton, { props })

    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(writeText.mock.calls.length).toBe(1))
    await flushPromises()
    expect(writeText.mock.calls[0]?.[0]).toContain('### List pets')
    expect(writeText.mock.calls[0]?.[0]).not.toContain('Create pet')
    expect(wrapper.text()).toBe('Copied')
    await vi.waitFor(() => expect(wrapper.text()).toBe('Copy as Markdown'), { timeout: 2000 })
    wrapper.unmount()
  })

  it('starts an asynchronous clipboard write during the click', async () => {
    const items: Record<string, Promise<Blob>>[] = []
    class TestClipboardItem {
      constructor(data: Record<string, Promise<Blob>>) {
        items.push(data)
      }
    }
    const write = vi.fn(async (): Promise<void> => {
      await items[0]?.['text/plain']
    })
    vi.stubGlobal('navigator', { clipboard: { write } })
    vi.stubGlobal('ClipboardItem', TestClipboardItem)
    const wrapper = mount(CopyMarkdownButton, { props })

    wrapper.get('button').element.click()
    expect(write.mock.calls.length).toBe(1)
    await flushPromises()
    await vi.waitFor(() => expect(wrapper.text()).toBe('Copied'))
    wrapper.unmount()
  })

  it('reports denied clipboard access without showing success', async () => {
    const toast = vi.fn()
    initializeToasts(toast)
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
    vi.stubGlobal('ClipboardItem', undefined)
    const wrapper = mount(CopyMarkdownButton, { props })

    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(toast.mock.calls.length).toBe(1))
    expect(toast.mock.calls[0]?.slice(0, 2)).toEqual(['Failed to copy Markdown', 'error'])
    expect(wrapper.text()).toBe('Copy as Markdown')
    expect(wrapper.get('button').attributes('aria-disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('does not show confirmation on a different operation after navigation', async () => {
    const pending: { resolve?: () => void } = {}
    const promise = new Promise<void>((resolve) => {
      pending.resolve = resolve
    })
    const writeText = vi.fn(() => promise)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('ClipboardItem', undefined)
    const wrapper = mount(CopyMarkdownButton, { props })

    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(writeText.mock.calls.length).toBe(1))
    await wrapper.setProps({ method: 'post' })
    pending.resolve?.()
    await flushPromises()
    expect(wrapper.text()).toBe('Copy as Markdown')
    wrapper.unmount()
  })
  it('reports conversion failures without copying an empty value', async () => {
    const toast = vi.fn()
    const writeText = vi.fn()
    initializeToasts(toast)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('ClipboardItem', undefined)
    const wrapper = mount(CopyMarkdownButton, { props: { ...props, path: '/missing' } })

    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(toast.mock.calls.length).toBe(1))
    expect(writeText.mock.calls.length).toBe(0)
    expect(wrapper.text()).toBe('Copy as Markdown')
    wrapper.unmount()
  })

  it('reports an unavailable clipboard', async () => {
    const toast = vi.fn()
    initializeToasts(toast)
    vi.stubGlobal('navigator', {})
    const wrapper = mount(CopyMarkdownButton, { props })

    await wrapper.get('button').trigger('click')
    expect(toast.mock.calls[0]?.slice(0, 2)).toEqual(['Failed to copy Markdown', 'error'])
    expect(wrapper.text()).toBe('Copy as Markdown')
    wrapper.unmount()
  })

  it('ignores repeated clicks while a write is pending', async () => {
    const pending: { resolve?: () => void } = {}
    const promise = new Promise<void>((resolve) => {
      pending.resolve = resolve
    })
    const writeText = vi.fn(() => promise)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('ClipboardItem', undefined)
    const wrapper = mount(CopyMarkdownButton, { props })

    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(writeText.mock.calls.length).toBe(1))
    await wrapper.get('button').trigger('click')
    expect(writeText.mock.calls.length).toBe(1)
    wrapper.unmount()
    pending.resolve?.()
    await flushPromises()
  })
})
