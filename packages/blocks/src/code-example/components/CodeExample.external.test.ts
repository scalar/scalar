import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { EXTERNAL_EXAMPLES } from '@scalar/workspace-store/helpers/use-external-examples'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { generateClientOptions } from '../helpers/generate-client-options'
import CodeExample from './CodeExample.vue'

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

describe('CodeExample.external', () => {
  it('waits for visibility, displays the selected payload, and retries failures', async () => {
    let visible: ((entries: { isIntersecting: boolean }[]) => void) | undefined
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof visible) {
          visible = callback
        }
        observe(): void {}
        disconnect(): void {}
      },
    )
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ shippingType: 'standard' }))
    const store = createWorkspaceStore({ fetch })
    await store.addDocument({
      name: 'shipping',
      document: { openapi: '3.1.0', info: { title: 'Shipping', version: '1' }, paths: {} },
    })
    const wrapper = mount(CodeExample, {
      props: {
        clientOptions: generateClientOptions(),
        selectedClient: 'shell/curl',
        method: 'post',
        path: '/shipments',
        eventBus: createWorkspaceEventBus(),
        securitySchemes: [],
        operation: {
          requestBody: {
            content: {
              'application/json': {
                examples: {
                  standard: { externalValue: 'https://example.com/standard' },
                  express: { externalValue: 'https://example.com/express' },
                },
              },
            },
          },
        },
      },
      global: { provide: { [EXTERNAL_EXAMPLES]: () => store.externalExamples() } },
    })
    await nextTick()
    expect(fetch.mock.calls.length).toBe(0)
    expect(wrapper.text()).toContain('Loading example')
    visible?.([{ isIntersecting: true }])
    await vi.waitFor(() => expect(wrapper.text()).toContain('Could not load this example'))
    const retry = wrapper.findAll('button').find((button) => button.text() === 'Retry')
    if (!retry) throw new Error('Missing retry control')
    await retry.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('shippingType'))
    expect(wrapper.text()).toContain('standard')
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://example.com/standard',
      'https://example.com/standard',
    ])
  })
})
