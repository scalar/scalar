import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { initializeToasts } from '@scalar/use-toasts'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import CopyAsyncApiMarkdownButton from './CopyAsyncApiMarkdownButton.vue'

const input = {
  asyncapi: '3.1.0',
  info: { title: 'Events API', version: '1', tags: [{ name: 'orders' }] },
  channels: {
    'orders/~events': {
      address: 'orders.created',
      title: 'Order channel',
      tags: [{ name: 'orders' }],
      messages: { created: { title: 'Order created', payload: { type: 'string' } } },
    },
    other: { address: 'unrelated', title: 'Unrelated channel' },
  },
  operations: {
    receiveOrders: { action: 'receive', title: 'Receive orders', channel: { $ref: '#/channels/orders~1~0events' } },
  },
}

const store = createWorkspaceStore()
beforeAll(async () => {
  await store.addDocument({ name: 'events', document: input })
})

const getDocument = (): AsyncApiDocument => {
  const document = store.workspace.documents.events
  if (!document || !('asyncapi' in document)) {
    throw new Error('Expected AsyncAPI document')
  }
  return document
}

enableAutoUnmount(afterEach)
afterEach(() => {
  vi.unstubAllGlobals()
  initializeToasts(() => null)
})

describe('CopyAsyncApiMarkdownButton', () => {
  it.each([
    { selection: { channel: 'orders/~events' }, heading: 'Order channel' },
    { selection: { operation: 'receiveOrders' }, heading: 'Receive orders' },
    { selection: { tag: 'orders' }, heading: 'orders' },
    { selection: { introduction: true }, heading: 'Events API' },
  ] as const)('copies the selected page: $heading', async ({ selection, heading }) => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('ClipboardItem', undefined)
    const wrapper = mount(CopyAsyncApiMarkdownButton, { props: { document: getDocument(), selection } })
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(writeText.mock.calls.length).toBe(1))
    const markdown = writeText.mock.calls[0]?.[0]
    expect(markdown).toContain(heading)
    expect(markdown).not.toContain('Unrelated channel')
    if ('introduction' in selection) {
      expect(markdown).not.toContain('Order created')
    } else {
      expect(markdown).toContain('Order created')
    }
    await flushPromises()
    expect(wrapper.text()).toBe('Copied')
  })

  it('reports missing selections without copying an empty value', async () => {
    const writeText = vi.fn()
    const toast = vi.fn()
    initializeToasts(toast)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('ClipboardItem', undefined)
    const wrapper = mount(CopyAsyncApiMarkdownButton, {
      props: { document: getDocument(), selection: { channel: 'missing' } },
    })
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(toast.mock.calls.length).toBe(1))
    expect(writeText.mock.calls.length).toBe(0)
    expect(wrapper.text()).toBe('Copy as Markdown')
  })

  it('does not show success on a different selection after navigation', async () => {
    const pending: { resolve?: () => void } = {}
    const promise = new Promise<void>((resolve) => {
      pending.resolve = resolve
    })
    const writeText = vi.fn(() => promise)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('ClipboardItem', undefined)
    const wrapper = mount(CopyAsyncApiMarkdownButton, {
      props: { document: getDocument(), selection: { channel: 'orders/~events' } },
    })
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(writeText.mock.calls.length).toBe(1))
    await wrapper.setProps({ selection: { introduction: true } })
    pending.resolve?.()
    await flushPromises()
    expect(wrapper.text()).toBe('Copy as Markdown')
  })
})
