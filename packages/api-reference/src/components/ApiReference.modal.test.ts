import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ApiReference from '@/components/ApiReference.vue'

enableAutoUnmount(afterEach)

describe('ApiReference.modal', () => {
  it('resolves the pre-selected first operation after changeSelectedDocument runs again', async () => {
    const wrapper = mount(ApiReference, {
      attachTo: document.body,
      props: {
        configuration: {
          default: false,
          sources: [
            {
              slug: 'widgets-api',
              default: true,
              content: {
                openapi: '3.1.0',
                info: { title: 'Widgets', version: '1.0.0' },
                paths: {
                  '/widgets': {
                    get: { summary: 'Get widgets', operationId: 'getWidgets' },
                  },
                },
              },
            },
            {
              slug: 'gadgets-api',
              content: {
                openapi: '3.1.0',
                info: { title: 'Gadgets', version: '1.0.0' },
                paths: {
                  '/gadgets': {
                    get: { summary: 'Get gadgets', operationId: 'getGadgets' },
                  },
                },
              },
            },
          ],
        },
      },
    })

    await flushPromises()

    // Wait for the dynamically imported client to finish mounting before reselecting
    // the document, so changeSelectedDocument routes through a real client instance.
    await vi.waitFor(
      () => {
        const dialog = wrapper.get('[role="dialog"][aria-label="API Client"]')
        expect(dialog.get('[data-testid="code-input-disabled"]').text()).toBe('/widgets')
      },
      { timeout: 10_000 },
    )

    const documentSelector = wrapper.findComponent({ name: 'DocumentSelector' })
    expect(documentSelector.exists()).toBe(true)
    documentSelector.vm.$emit('update:modelValue', 'widgets-api')
    await flushPromises()

    // The first operation is already selected, so opening it skips re-routing.
    wrapper.vm.eventBus.emit('ui:open:client-modal', { method: 'get', path: '/widgets' })

    await vi.waitFor(async () => {
      await flushPromises()
      const dialog = wrapper.get('[role="dialog"][aria-label="API Client"]')

      // The dialog stays mounted while closed; its container controls visibility.
      expect(wrapper.find('.scalar-client--open [role="dialog"][aria-label="API Client"]').exists()).toBe(true)
      expect(dialog.get('[data-testid="code-input-disabled"]').text()).toBe('/widgets')
      expect(dialog.text()).not.toContain('Select an operation to view details')
    })
  })
})
