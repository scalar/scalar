import type { ModalState } from '@scalar/components'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ModalClientContainer from '@/v2/components/modals/ModalClientContainer.vue'

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
    const wrapper = mount(ModalClientContainer, {
      props: {
        modalState: createModalState(),
      },
    })

    expect(wrapper.find('.scalar-app').exists()).toBe(true)
  })

  it('process slot with ScalarTeleportRoot', () => {
    const wrapper = mount(ModalClientContainer, {
      props: {
        modalState: createModalState(),
      },
      slots: {
        default: '<button id="test-button">Test</button>"',
      },
    })

    expect(wrapper.find('#test-button').exists()).toBe(true)

    const teleport = wrapper.find('[id*="scalar-teleport"]')

    expect(teleport.exists()).toBe(true)
    expect(teleport.find('#test-button').exists()).toBe(false)
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

  it('activates focus trap and emits open', async ({ onTestFinished }) => {
    vi.useFakeTimers()

    let modalState = createModalState(false)

    const wrapper = mount(ModalClientContainer, {
      props: { modalState },
      slots: { default: '<button id="test-button">Toggle</button>' },
      attachTo: document.body,
    })

    modalState = { ...modalState, open: true }
    await wrapper.setProps({ modalState })

    vi.runAllTimers()

    const button = wrapper.find('#test-button').element

    expect(document.activeElement).toBe(button)
    expect(wrapper.emitted('open')).toBeTruthy()

    onTestFinished(() => {
      wrapper.unmount()
      vi.useRealTimers()
    })
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

    expect(document.activeElement).toBe(document.body)
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

    expect(document.activeElement).toBe(document.body)
  })
})
