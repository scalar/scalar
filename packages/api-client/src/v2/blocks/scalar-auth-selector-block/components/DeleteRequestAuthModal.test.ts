import { useModal } from '@scalar/components/modal'
import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'

describe('DeleteRequestAuthModal', () => {
  enableAutoUnmount(afterEach)

  const mountModal = (label: string) => {
    const state = useModal()
    const wrapper = mount(DeleteRequestAuthModal, {
      attachTo: document.body,
      props: { state, label },
    })
    return { state, wrapper }
  }

  // Headless UI teleports the dialog outside the mounted component.
  const getDialog = (): ReturnType<DOMWrapper<Element>['get']> => new DOMWrapper(document.body).get('[role="dialog"]')

  it('renders the security scheme label and warning after opening', async () => {
    const { state } = mountModal('Test Label')
    expect(document.querySelector('[role="dialog"]')).toBeNull()

    state.show()
    await flushPromises()

    const dialog = getDialog()
    expect(dialog.get('h2').text()).toBe('Delete Security Scheme')
    expect(dialog.get('p').text()).toBe(
      "This cannot be undone. You're about to delete the Test Label security scheme from the collection.",
    )
    expect(dialog.get('button[type="submit"]').text()).toBe('Delete Test Label')
  })

  it('emits close without deleting when cancelling', async () => {
    const { state, wrapper } = mountModal('Alpha')
    state.show()
    await flushPromises()

    const cancel = getDialog().get('button[type="button"]')
    expect(cancel.text()).toBe('Cancel')
    await cancel.trigger('click')

    expect(wrapper.emitted('close')).toStrictEqual([[]])
    expect(wrapper.emitted('delete')).toBeUndefined()
  })

  it('emits delete without cancellation when confirming', async () => {
    const { state, wrapper } = mountModal('Beta')
    state.show()
    await flushPromises()

    const confirm = getDialog().get('button[type="submit"]')
    expect(confirm.text()).toBe('Delete Beta')
    await confirm.trigger('click')

    expect(wrapper.emitted('delete')).toStrictEqual([[]])
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('hides the dialog without deleting when its state is closed', async () => {
    const { state, wrapper } = mountModal('Beta')
    state.show()
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()

    state.hide()
    await flushPromises()

    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(wrapper.emitted('delete')).toBeUndefined()
  })
})
