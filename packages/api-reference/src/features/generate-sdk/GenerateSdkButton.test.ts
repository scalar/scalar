import { useModal } from '@scalar/components/modal'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

import GenerateSdkButton from './GenerateSdkButton.vue'
import { GENERATE_SDK_CONTEXT_SYMBOL, type GenerateSdkContext } from './use-generate-sdk'

const createContext = (enabled = true): GenerateSdkContext => {
  const dialog = useModal()
  return { enabled: computed(() => enabled), dialog, open: vi.fn(() => dialog.show()) }
}

const mountButton = (context: GenerateSdkContext) =>
  mount(GenerateSdkButton, {
    global: { provide: { [GENERATE_SDK_CONTEXT_SYMBOL as symbol]: context } },
  })

describe('GenerateSdkButton', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a button named Generate SDK that announces a dialog', () => {
    const wrapper = mountButton(createContext())

    const button = wrapper.get('button')
    expect(button.text()).toBe('Generate SDK')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-haspopup')).toBe('dialog')
  })

  it('exposes the custom CSS hooks', () => {
    const wrapper = mountButton(createContext())
    expect(wrapper.get('button').element.matches('.generate-sdk-button.generate-sdk-button--toolbar')).toBe(true)
  })

  it('renders nothing when the reference is not running locally', () => {
    const wrapper = mountButton(createContext(false))

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('opens the Explore Scalar dialog', async () => {
    const context = createContext()
    const wrapper = mountButton(context)

    await wrapper.get('button').trigger('click')

    expect(context.open).toHaveBeenCalledTimes(1)
    expect(context.dialog.open).toBe(true)
  })

  describe('in the localhost shell', () => {
    /** The shell's side panel takes over from the dialog on wide screens */
    const createPanelContext = (active: boolean, expanded: boolean): GenerateSdkContext => ({
      ...createContext(),
      panel: { id: 'shell-panel', active: computed(() => active), expanded: computed(() => expanded) },
    })

    it('discloses the side panel instead of announcing a dialog', () => {
      const wrapper = mountButton(createPanelContext(true, true))
      const button = wrapper.get('button')

      expect(button.attributes('aria-haspopup')).toBeUndefined()
      expect(button.attributes('aria-expanded')).toBe('true')
      expect(button.attributes('aria-controls')).toBe('shell-panel')
    })

    it('only points at the panel while it is open', () => {
      const wrapper = mountButton(createPanelContext(true, false))
      const button = wrapper.get('button')

      expect(button.attributes('aria-expanded')).toBe('false')
      expect(button.attributes('aria-controls')).toBeUndefined()
    })

    it('announces the dialog again while the panel has no room', () => {
      const wrapper = mountButton(createPanelContext(false, false))
      const button = wrapper.get('button')

      expect(button.attributes('aria-haspopup')).toBe('dialog')
      expect(button.attributes('aria-expanded')).toBeUndefined()
    })
  })
})
