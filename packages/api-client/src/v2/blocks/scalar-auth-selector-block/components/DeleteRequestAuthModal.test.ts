import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import DeleteRequestAuthModal from '@/v2/blocks/scalar-auth-selector-block/components/DeleteRequestAuthModal.vue'

window.ResizeObserver =
  window.ResizeObserver ||
  vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }))

describe.todo('DeleteRequestAuthModal', () => {
  const getState = (open: boolean) => ({
    hide: () => {
      return
    },
    show: () => {
      return
    },
    open,
  })

  it('renders modal content with label', () => {
    const label = 'Test Label'
    const wrapper = mount(DeleteRequestAuthModal, {
      attachTo: document.body,
      props: {
        state: getState(true),
        label,
      },
    })

    expect(wrapper.text()).toContain('This cannot be undone')
    expect(wrapper.text()).toContain(label)
  })

  it('emits close when clicking Cancel', async () => {
    const wrapper = mount(DeleteRequestAuthModal, {
      attachTo: document.body,
      props: {
        state: getState(true),
        label: 'Alpha',
      },
    })

    const buttons = wrapper.findAll('button')
    const cancelButton = buttons.find((b) => b.text() === 'Cancel')
    expect(cancelButton, 'Cancel button should exist').toBeTruthy()

    await cancelButton!.trigger('click')
    expect(wrapper.emitted('close')?.length).toBe(1)
  })

  it('emits delete when confirming', async () => {
    const label = 'Beta'
    const wrapper = mount(DeleteRequestAuthModal, {
      attachTo: document.body,
      props: {
        state: getState(true),
        label,
      },
    })

    const buttons = wrapper.findAll('button')
    const deleteButton = buttons.find((b) => b.text() === `Delete ${label}`)
    expect(deleteButton, 'Delete button should exist').toBeTruthy()

    await deleteButton!.trigger('click')
    expect(wrapper.emitted('delete')?.length).toBe(1)
  })
})
