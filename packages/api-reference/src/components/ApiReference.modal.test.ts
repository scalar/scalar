import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ApiReference from '@/components/ApiReference.vue'

enableAutoUnmount(afterEach)

const dialogSelector = '[role="dialog"][aria-label="API Client"]'
const openDialogSelector = `.scalar-client--open ${dialogSelector}`

describe('ApiReference.modal', () => {
  it('keeps the first operation available after reselecting the active document', async () => {
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

    await vi.waitFor(
      () => {
        const dialog = wrapper.get(dialogSelector)
        expect(dialog.get('[data-testid="code-input-disabled"]').text()).toBe('/widgets')
        expect(dialog.findAll('[type="button"]').some((button) => button.text() === 'GET')).toBe(true)
      },
      { timeout: 10_000 },
    )
    expect(wrapper.find(openDialogSelector).exists()).toBe(false)
    expect(wrapper.vm.workspaceStore.workspace['x-scalar-active-document']).toBe('widgets-api')

    // Reproduce the second document sync after the dynamically imported modal has mounted.
    wrapper.getComponent({ name: 'DocumentSelector' }).vm.$emit('update:modelValue', 'widgets-api')
    await flushPromises()
    expect(wrapper.vm.workspaceStore.workspace['x-scalar-active-document']).toBe('widgets-api')
    expect(wrapper.vm.workspaceStore.workspace.documents['widgets-api']?.info.title).toBe('Widgets')

    // The first operation is already selected, so opening it skips re-routing.
    wrapper.vm.eventBus.emit('ui:open:client-modal', { method: 'get', path: '/widgets' })

    await vi.waitFor(async () => {
      await flushPromises()
      const dialog = wrapper.get(openDialogSelector)

      // Keep a missing document distinct from the missing-operation regression.
      expect(dialog.text()).not.toContain('No document selected')
      expect(dialog.text()).not.toContain('Select an operation to view details')
      expect(dialog.get('[data-testid="code-input-disabled"]').text()).toBe('/widgets')
      expect(dialog.findAll('[type="button"]').some((button) => button.text() === 'GET')).toBe(true)
    })
  }, 15_000)
})
