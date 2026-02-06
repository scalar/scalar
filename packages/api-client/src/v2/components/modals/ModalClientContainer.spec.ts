import type { ModalState } from '@scalar/components'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ModalClientContainer from '@/v2/components/modals/ModalClientContainer.vue'

const {
  //
  activateMock,
  deactivateMock,
  addScalarClassesToHeadlessMock,
} = vi.hoisted(() => ({
  activateMock: vi.fn(),
  deactivateMock: vi.fn(),
  addScalarClassesToHeadlessMock: vi.fn(),
}))

vi.mock('@vueuse/integrations/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: activateMock,
    deactivate: deactivateMock,
  }),
}))

vi.mock('@scalar/components', () => ({
  addScalarClassesToHeadless: addScalarClassesToHeadlessMock,
  ScalarTeleportRoot: {
    template: '<div><slot /></div>',
  },
}))

function createModalState(open = false): ModalState {
  return {
    open,
    show: vi.fn(),
    hide: vi.fn(),
  }
}

describe('ModalClient.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls addScalarClassesToHeadless on mount', () => {
    mount(ModalClientContainer, {
      props: {
        modalState: createModalState(),
      },
    })

    expect(addScalarClassesToHeadlessMock).toHaveBeenCalled()
  })

  it('is hidden when modalState.open is false', () => {
    const wrapper = mount(ModalClientContainer, {
      props: {
        modalState: createModalState(false),
      },
    })

    expect(wrapper.find('.scalar').isVisible()).toBe(false)
  })

  it('shows when modalState.open becomes true', async () => {
    let modalState = createModalState(false)

    const wrapper = mount(ModalClientContainer, {
      attachTo: document.body,
      props: { modalState },
    })

    modalState = { ...modalState, open: true }
    await wrapper.setProps({ modalState })
    await nextTick()

    expect(wrapper.find('.scalar').isVisible()).toBe(true)
  })

  it('activates focus trap and emits open', async () => {
    let modalState = createModalState(false)

    const wrapper = mount(ModalClientContainer, {
      attachTo: document.body,
      props: { modalState },
    })

    modalState = { ...modalState, open: true }
    await wrapper.setProps({ modalState })
    await nextTick()

    expect(activateMock).toHaveBeenCalled()
    expect(wrapper.emitted('open')).toBeTruthy()
  })

  it('deactivates focus trap and emits close', async () => {
    let modalState = createModalState(true)

    const wrapper = mount(ModalClientContainer, {
      attachTo: document.body,
      props: { modalState },
    })

    modalState = { ...modalState, open: false }
    await wrapper.setProps({ modalState })
    await nextTick()

    expect(deactivateMock).toHaveBeenCalled()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('calls modalState.hide when overlay is clicked', async () => {
    const modalState = createModalState(true)

    const wrapper = mount(ModalClientContainer, {
      props: { modalState },
    })

    await wrapper.find('.scalar-app-exit').trigger('click')

    expect(modalState.hide).toHaveBeenCalled()
  })

  it('deactivates focus trap on unmount', () => {
    const modalState = createModalState(true)

    const wrapper = mount(ModalClientContainer, {
      props: { modalState },
    })

    wrapper.unmount()

    expect(deactivateMock).toHaveBeenCalled()
  })
})
