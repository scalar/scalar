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

const mountButton = (context: GenerateSdkContext, variant?: 'toolbar' | 'card' | 'footer') =>
  mount(GenerateSdkButton, {
    props: { variant },
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

  it('renders nothing when the reference is not running locally', () => {
    const wrapper = mountButton(createContext(false))

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it.each(['card', 'toolbar', 'footer'] as const)(
    'opens the Explore Scalar dialog from the %s variant',
    async (variant) => {
      const context = createContext()
      const wrapper = mountButton(context, variant)

      const button = wrapper.get('button')
      expect(button.text()).toBe('Generate SDK')

      await button.trigger('click')

      expect(context.open).toHaveBeenCalledTimes(1)
      expect(context.dialog.open).toBe(true)
    },
  )
})
