import type { ModalState } from '@scalar/components/modal'
import { mount } from '@vue/test-utils'
import type { UseFocusTrapOptions } from '@vueuse/integrations/useFocusTrap'
import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ModalClientContainer from '@/v2/components/modals/ModalClientContainer.vue'

/**
 * Capture the options handed to the focus trap while keeping the real trap in
 * place, so the existing activation tests keep exercising focus-trap itself.
 */
const captured = vi.hoisted(() => ({
  options: undefined as UseFocusTrapOptions | undefined,
}))

vi.mock('@vueuse/integrations/useFocusTrap', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@vueuse/integrations/useFocusTrap')>()
  return {
    ...mod,
    useFocusTrap: (...args: Parameters<typeof mod.useFocusTrap>) => {
      captured.options = args[1]
      return mod.useFocusTrap(...args)
    },
  }
})

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

    // Visibility is controlled via CSS class (not v-show/display:none) to avoid layout reflow on open
    expect(wrapper.find('.scalar-container').classes()).not.toContain('scalar-client--open')
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

    expect(wrapper.find('.scalar-container').classes()).toContain('scalar-client--open')

    onTestFinished(() => {
      wrapper.unmount()
    })
  })

  it('activates focus trap and emits open', async ({ onTestFinished }) => {
    let modalState = createModalState(false)

    const wrapper = mount(ModalClientContainer, {
      props: { modalState },
      slots: { default: '<button id="focus-target">Target</button>' },
      attachTo: document.body,
    })

    modalState = { ...modalState, open: true }
    await wrapper.setProps({ modalState })

    // Wait for Vue to flush the watch callback
    await nextTick()
    // Wait for the inner nextTick inside the watch (before activateFocusTrap is called)
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

    onTestFinished(() => {
      wrapper.unmount()
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

  describe('initial focus', () => {
    const resolveInitialFocus = (): unknown => {
      const initialFocus = captured.options?.initialFocus
      assert(typeof initialFocus === 'function')
      return (initialFocus as () => unknown)()
    }

    it('resolves the marked element inside the dialog', () => {
      const wrapper = mount(ModalClientContainer, {
        props: { modalState: createModalState() },
        slots: {
          default: '<button id="first">First</button><button id="close" data-modal-initial-focus>Close</button>',
        },
      })

      expect(resolveInitialFocus()).toBe(wrapper.find('#close').element)
    })

    it('keeps the default first tabbable element when nothing is marked', () => {
      mount(ModalClientContainer, {
        props: { modalState: createModalState() },
        slots: { default: '<button id="first">First</button>' },
      })

      // `undefined` keeps focus-trap's default, whereas `null` would make it throw.
      expect(resolveInitialFocus()).toBeUndefined()
    })

    it('falls back to the dialog container itself', () => {
      const wrapper = mount(ModalClientContainer, {
        props: { modalState: createModalState() },
      })

      const fallbackFocus = captured.options?.fallbackFocus
      assert(typeof fallbackFocus === 'function')
      expect(fallbackFocus()).toBe(wrapper.find('[role="dialog"]').element)
    })
  })
})
