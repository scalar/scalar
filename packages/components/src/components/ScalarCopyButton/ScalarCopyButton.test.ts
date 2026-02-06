import { ScalarIconCheck, ScalarIconCopy } from '@scalar/icons'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarCopyButton from './ScalarCopyButton.vue'

describe('ScalarCopyButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders with copy icon by default', () => {
      const wrapper = mount(ScalarCopyButton)
      const iconComponent = wrapper.findComponent(ScalarIconCopy)
      expect(iconComponent.exists()).toBeTruthy()
    })

    it('renders with check icon when copied is true', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: true,
        },
      })
      await nextTick()
      const iconComponent = wrapper.findComponent(ScalarIconCheck)
      expect(iconComponent.exists()).toBeTruthy()
    })
  })

  describe('placement prop', () => {
    it('accepts left placement prop', () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          placement: 'left',
        },
      })
      expect(wrapper.props('placement')).toBe('left')
    })

    it('accepts right placement prop', () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          placement: 'right',
        },
      })
      expect(wrapper.props('placement')).toBe('right')
    })
  })

  describe('click behavior', () => {
    it('sets copied to true when clicked', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('shows check icon after click', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
        },
      })

      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeFalsy()

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeFalsy()
    })

    it('shows copied message after click', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.text()).toBe('Copied to clipboard')
    })
  })

  describe('slots', () => {
    it('renders default copy slot text', () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
        },
      })

      expect(wrapper.text()).toBe('Copy to clipboard')
    })

    it('renders custom copy slot', () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
        },
        slots: {
          copy: 'Custom copy text',
        },
      })

      expect(wrapper.text()).toBe('Custom copy text')
    })

    it('renders custom copied slot', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: true,
        },
        slots: {
          copied: 'Custom copied text',
        },
      })

      await nextTick()

      expect(wrapper.text()).toBe('Custom copied text')
    })
  })

  describe('clear timeout', () => {
    it('clears copied state after default timeout', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
          clear: 1500,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()

      vi.advanceTimersByTime(1500)
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeFalsy()
    })

    it('clears copied state after custom timeout', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
          clear: 2000,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()

      vi.advanceTimersByTime(1999)
      await nextTick()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()

      vi.advanceTimersByTime(1)
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeFalsy()
    })

    it('does not clear copied state when clear is false', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
          clear: false,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()

      vi.advanceTimersByTime(10000)
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeFalsy()
    })

    it('handles multiple clicks correctly', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
          clear: 1000,
        },
      })

      // First click - sets copied to true
      await wrapper.find('button').trigger('click')
      await nextTick()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()

      // Wait for timeout to complete
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()

      // Click again - should set a new timeout
      await wrapper.find('button').trigger('click')
      await nextTick()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()

      // Wait for the new timeout to complete
      vi.advanceTimersByTime(1000)
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeFalsy()
    })
  })

  describe('model value updates', () => {
    it('updates icon when modelValue changes externally', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
        },
      })

      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()

      await wrapper.setProps({ modelValue: true })
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeFalsy()
    })

    it('updates icon when modelValue changes from true to false', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: true,
        },
      })

      await nextTick()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()

      await wrapper.setProps({ modelValue: false })
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeFalsy()
    })
  })

  describe('accessibility', () => {
    it('renders as a button element with correct type', () => {
      const wrapper = mount(ScalarCopyButton)
      expect(wrapper.find('button').exists()).toBeTruthy()
      expect(wrapper.attributes('type')).toBe('button')
    })

    it('has role="alert" on copied message for screen reader announcements', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          modelValue: false,
        },
      })

      await wrapper.find('button').trigger('click')
      await nextTick()

      const alertElement = wrapper.find('[role="alert"]')
      expect(alertElement.exists()).toBeTruthy()
      expect(alertElement.text()).toBe('Copied to clipboard')
    })
  })
})
