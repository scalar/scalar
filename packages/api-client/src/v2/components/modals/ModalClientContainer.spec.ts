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

  it('shows when modalState.open becomes true', async ({ onTestFinished }) => {
    let modalState = createModalState(false)

    const wrapper = mount(ModalClientContainer, {
      attachTo: document.body,
      props: { modalState },
    })

    modalState = { ...modalState, open: true }
    await wrapper.setProps({ modalState })
    await nextTick()

    expect(wrapper.find('.scalar').isVisible()).toBe(true)

    onTestFinished(async () => {
      await wrapper.unmount()
      // Clean the body after the test
      document.body.innerHTML = ''
    })
  })

  it('activates focus trap and emits open', async ({ onTestFinished }) => {
    let modalState = createModalState(false)

    const wrapper = mount(ModalClientContainer, {
      props: { modalState },
      slots: { default: '<button id="focus-target">Target</button>' },
      attachTo: document.body,
    })
    console.log('document.outerHTML', document.body.outerHTML)

    modalState = { ...modalState, open: true }
    await wrapper.setProps({ modalState })

    // Wait for the focus trap to activate
    await nextTick()
    // Wait for the browser to apply the focus
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.emitted('open')).toBeTruthy()

    const focusTarget = wrapper.find('#focus-target').element
    const fallbackFocus = wrapper.find('[role="dialog"]').element

    /**
     * Reliably targeting the button in unit tests wasn’t feasible,
     * an E2E test (via `playwright`) was added to ensure focus behaves correctly when the modal opens.
     *
     * E2E test:
     * - packages/api-reference/test/features/client-modal.e2e.ts
     * - 'opens the client modal when clicked and set focus properly'
     *
     * @see https://github.com/scalar/scalar/pull/8072#pullrequestreview-3783424790
     */
    expect([focusTarget, fallbackFocus]).toContain(document.activeElement)

    onTestFinished(async () => {
      await wrapper.unmount()
      document.body.innerHTML = ''
    })
  })

  it('deactivates focus trap and emits close', async () => {
    let modalState = createModalState(true)

    const wrapper = mount(ModalClientContainer, {
      props: { modalState },
    })

    modalState = { ...modalState, open: false }
    await wrapper.setProps({ modalState })
    await nextTick()

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
  })
})
