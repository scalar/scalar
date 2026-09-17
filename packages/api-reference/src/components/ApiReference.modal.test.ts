import { EditorView } from '@scalar/use-codemirror'
import { type VueWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ApiReference from '@/components/ApiReference.vue'

enableAutoUnmount(afterEach)

const dialogSelector = '[role="dialog"][aria-label="API Client"]'
const openDialogSelector = `.scalar-client--open ${dialogSelector}`

/** Mount the real client and wait for its initial request to resolve before interacting with it. */
const mountReference = async (): Promise<VueWrapper<InstanceType<typeof ApiReference>>> => {
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
                  post: {
                    summary: 'Create widget',
                    operationId: 'createWidget',
                    requestBody: {
                      content: {
                        'application/json': {
                          schema: { type: 'object', properties: { name: { type: 'string' } } },
                          example: { name: 'Original widget' },
                        },
                      },
                    },
                  },
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

  return wrapper
}

/** Read the editable request body, excluding read-only response and code-sample editors. */
const getBodyEditor = (dialog: Element): EditorView => {
  const content = dialog.querySelector<HTMLElement>('.cm-content[contenteditable="true"]')
  const editor = content && EditorView.findFromDOM(content)
  if (!editor) {
    throw new Error('The request body editor has not initialized')
  }
  return editor
}

describe('ApiReference.modal', () => {
  it('keeps the first operation available after reselecting the active document', async () => {
    const wrapper = await mountReference()

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

  it('preserves an edited request body when reopening the same operation', async () => {
    const wrapper = await mountReference()
    wrapper.vm.eventBus.emit('ui:open:client-modal', { method: 'post', path: '/widgets' })

    await vi.waitFor(() => {
      const dialog = wrapper.get(openDialogSelector)
      expect(JSON.parse(getBodyEditor(dialog.element).state.doc.toString())).toStrictEqual({ name: 'Original widget' })
    })

    const dialog = wrapper.get(openDialogSelector)
    const editor = getBodyEditor(dialog.element)
    const editedBody = JSON.stringify({ name: 'Edited widget' }, null, 2)

    // Use the real editor update and blur handlers, including persistence into the client store.
    const onBodyUpdate = vi.fn()
    wrapper.vm.eventBus.on('operation:update:requestBody:value', onBodyUpdate)
    editor.focus()
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: editedBody } })
    await dialog.get('.cm-content[contenteditable="true"]').trigger('blur')
    await flushPromises()
    await vi.waitFor(() => {
      expect(onBodyUpdate).toHaveBeenCalledWith({
        payload: editedBody,
        contentType: 'application/json',
        meta: { path: '/widgets', method: 'post', exampleKey: 'default' },
      })
      expect(getBodyEditor(dialog.element).state.doc.toString()).toBe(editedBody)
    })

    wrapper.vm.eventBus.emit('ui:close:client-modal')
    await flushPromises()
    expect(wrapper.find(openDialogSelector).exists()).toBe(false)

    wrapper.vm.eventBus.emit('ui:open:client-modal', { method: 'post', path: '/widgets' })
    await vi.waitFor(async () => {
      await flushPromises()
      const reopenedDialog = wrapper.get(openDialogSelector)
      expect(reopenedDialog.get('[data-testid="code-input-disabled"]').text()).toBe('/widgets')
      expect(reopenedDialog.findAll('[type="button"]').some((button) => button.text() === 'POST')).toBe(true)
      expect(getBodyEditor(reopenedDialog.element).state.doc.toString()).toBe(editedBody)
    })
  }, 15_000)
})
