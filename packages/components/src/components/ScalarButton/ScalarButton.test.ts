import { ScalarIconAcorn } from '@scalar/icons'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { markRaw, nextTick } from 'vue'

import { useLoadingState } from '../ScalarLoading'
import ScalarButton from './ScalarButton.vue'

describe('ScalarButton', () => {
  describe('rendering', () => {
    it('renders a button by default', () => {
      const wrapper = mount(ScalarButton, {
        slots: { default: 'Click me' },
      })
      expect(wrapper.find('button').exists()).toBeTruthy()
      expect(wrapper.attributes('type')).toBe('button')
    })

    it('can render a link using the is prop', () => {
      const wrapper = mount(ScalarButton, {
        props: { is: 'a', href: 'https://scalar.com' },
        slots: { default: "I'm a link!" },
      })
      expect(wrapper.find('a').exists()).toBeTruthy()
      expect(wrapper.attributes('type')).toBe(undefined)
      expect(wrapper.attributes('href')).toBe('https://scalar.com')
    })

    it.each(['button', 'submit', 'reset'])('allows buttons of type %s', (type) => {
      const wrapper = mount(ScalarButton, {
        props: { type },
        slots: { default: `${type} button` },
      })
      expect(wrapper.attributes('type')).toBe(type)
    })
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

  it('renders with an icon prop', () => {
    const wrapper = mount(ScalarButton, {
      props: { icon: markRaw(ScalarIconAcorn) },
    })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders the contents of the icon slot', () => {
    const wrapper = mount(ScalarButton, {
      slots: {
        default: 'With Icon',
        icon: '<span class="test-icon">★</span>',
      },
    })
    expect(wrapper.find('.test-icon').exists()).toBe(true)
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
})
