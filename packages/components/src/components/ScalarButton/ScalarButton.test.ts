import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { useLoadingState } from '../ScalarLoading'
import ScalarButton from './ScalarButton.vue'

describe('ScalarButton', () => {
  it('renders properly with default props', () => {
    const wrapper = mount(ScalarButton, {
      slots: {
        default: 'Click me',
      },
    })
    expect(wrapper.text()).toContain('Click me')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.attributes('aria-disabled')).toBeUndefined()
  })

  it('applies disabled state correctly', () => {
    const wrapper = mount(ScalarButton, {
      props: {
        disabled: true,
      },
      slots: {
        default: 'Disabled Button',
      },
    })
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  /**
   * It's important that the disabled button can receive focus.
   * @see https://css-tricks.com/making-disabled-buttons-more-inclusive
   */
  it('allows disabled buttons to receive focus', async () => {
    const wrapper = mount(ScalarButton, {
      props: {
        disabled: true,
      },
      slots: {
        default: 'Disabled Button',
      },
      attachTo: document.body,
    })

    // Trigger focus event
    await wrapper.element.focus()

    await nextTick()

    // Check if the button has focus by verifying it's the active element
    expect(document.activeElement).toBe(wrapper.element)
  })

  it('renders with icon slot', () => {
    const wrapper = mount(ScalarButton, {
      slots: {
        default: 'With Icon',
        icon: '<span class="test-icon">★</span>',
      },
    })
    expect(wrapper.find('.test-icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('With Icon')
  })

  it('handles loading state correctly', () => {
    const loadingState = useLoadingState()
    loadingState.startLoading()

    const wrapper = mount(ScalarButton, {
      props: {
        loading: loadingState,
      },
      slots: {
        default: 'Loading Button',
      },
    })
    expect(wrapper.find('.centered').exists()).toBe(true)
    expect(wrapper.find('span').classes()).toContain('invisible')
  })

  it('applies different variants correctly', () => {
    const variants = ['solid', 'outlined', 'ghost', 'danger'] as const
    variants.forEach((variant) => {
      const wrapper = mount(ScalarButton, {
        props: {
          variant,
        },
        slots: {
          default: `${variant} button`,
        },
      })
      expect(wrapper.classes()).toContain(`scalar-button-${variant}`)
    })
  })

  it('applies fullWidth prop correctly', () => {
    const wrapper = mount(ScalarButton, {
      props: {
        fullWidth: true,
      },
      slots: {
        default: 'Full Width Button',
      },
    })
    expect(wrapper.classes()).toContain('w-full')
  })

  it('handles different button types', () => {
    const types = ['button', 'submit', 'reset'] as const
    types.forEach((type) => {
      const wrapper = mount(ScalarButton, {
        props: {
          type,
        },
        slots: {
          default: `${type} button`,
        },
      })
      expect(wrapper.attributes('type')).toBe(type)
    })
  })
})
