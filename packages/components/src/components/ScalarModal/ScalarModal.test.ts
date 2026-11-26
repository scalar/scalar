import { stubDialogApi } from '@scalar/helpers/testing/stub-dialog'
import { type VueWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import type { ModalState } from './index'
import ScalarModal, { useModal } from './ScalarModal.vue'

enableAutoUnmount(afterEach)

let restoreDialogApi: () => void

/** Mount an open modal and wait for the dialog bridge to call `showModal()`. */
const mountOpen = async (props: Record<string, unknown> = {}): Promise<{ state: ModalState; wrapper: VueWrapper }> => {
  const state = useModal()
  state.show()
  const wrapper = mount(ScalarModal, {
    props: { state, ...props },
    slots: { default: '<input aria-label="Name" />' },
  })
  await nextTick()
  return { state, wrapper }
}

describe('ScalarModal', () => {
  beforeEach(() => {
    restoreDialogApi = stubDialogApi()
  })

  afterEach(() => {
    restoreDialogApi()
  })

  it('opens a native modal dialog from the modal state', async () => {
    const { state, wrapper } = await mountOpen()
    const dialog = wrapper.get('dialog').element

    expect(dialog.open).toBe(true)
    expect(wrapper.find('input').exists()).toBe(true)

    state.hide()
    await nextTick()
    expect(dialog.open).toBe(false)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('names the dialog after its title', async () => {
    const { wrapper } = await mountOpen({ title: 'Create new version' })
    const dialog = wrapper.get('dialog')
    const heading = wrapper.get('h2')

    expect(heading.text()).toBe('Create new version')
    expect(dialog.attributes('aria-labelledby')).toBe(heading.attributes('id'))
  })

  it('hides the state and emits close when the user presses Escape', async () => {
    const { state, wrapper } = await mountOpen()
    wrapper
      .get('input')
      .element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await nextTick()

    expect(state.open).toBe(false)
    expect(wrapper.emitted('close')).toEqual([[]])
  })

  it('does not emit close when the state is hidden programmatically', async () => {
    const { state, wrapper } = await mountOpen()
    state.hide()
    await nextTick()

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('renders a close button for the full size side panel', async () => {
    const { state, wrapper } = await mountOpen({ size: 'full' })
    const close = wrapper.findAll('button').find((button) => button.text() === 'Close modal')
    await close!.trigger('click')

    expect(state.open).toBe(false)
  })
})
