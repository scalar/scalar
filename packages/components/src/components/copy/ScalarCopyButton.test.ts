import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ScalarCopyButton from './ScalarCopyButton.vue'

describe('ScalarCopyButton', () => {
  describe('rendering', () => {
    it('renders a button element', () => {
      const wrapper = mount(ScalarCopyButton)
      expect(wrapper.find('button').exists()).toBeTruthy()
    })

    it('renders an SVG icon', () => {
      const wrapper = mount(ScalarCopyButton)
      expect(wrapper.find('svg').exists()).toBeTruthy()
    })

    it('renders with different styling when copied is true', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: true },
      })
      await nextTick()
      // When copied=true, the button has 'text-c-1' class
      expect(wrapper.find('button').classes()).toContain('text-c-1')
    })

    it('renders with default styling when copied is false', () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: false },
      })
      // When copied=false, the button has 'text-c-2' class
      expect(wrapper.find('button').classes()).toContain('text-c-2')
    })
  })

  describe('click behavior', () => {
    it('updates styling when copied prop changes', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: false },
      })

      // Initial state: text-c-2 styling
      expect(wrapper.find('button').classes()).toContain('text-c-2')

      await wrapper.setProps({ copied: true })
      await nextTick()

      // After prop change: text-c-1 styling
      expect(wrapper.find('button').classes()).toContain('text-c-1')
    })

    it('shows copied message when copied is true', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          copied: true,
        },
      })

      await nextTick()

      expect(wrapper.text()).toContain('Copied')
    })
  })

  describe('slots', () => {
    it('renders default copy slot text', () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          copied: false,
        },
      })

      expect(wrapper.text()).toContain('Copy')
    })

    it('renders custom copy slot', () => {
      const wrapper = mount(ScalarCopyButton, {
        props: {
          copied: false,
        },
        slots: {
          copy: 'Custom copy text',
        },
      })

      expect(wrapper.text()).toContain('Custom copy text')
    })

    it('renders custom copied slot', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: true },
        slots: { copied: 'Custom copied text' },
      })

      await nextTick()

      expect(wrapper.text()).toContain('Custom copied text')
    })
  })

  describe('copied model updates', () => {
    it('responds to copied prop changes from false to true', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: false },
      })

      // Initial state
      expect(wrapper.find('button').classes()).toContain('text-c-2')

      await wrapper.setProps({ copied: true })
      await nextTick()

      // After prop change
      expect(wrapper.find('button').classes()).toContain('text-c-1')
    })

    it('responds to copied prop changes from true to false', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: true },
      })

      await nextTick()
      // Initial state
      expect(wrapper.find('button').classes()).toContain('text-c-1')

      await wrapper.setProps({ copied: false })
      await nextTick()

      // After prop change
      expect(wrapper.find('button').classes()).toContain('text-c-2')
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
        props: { copied: true },
      })

      await nextTick()

      const alertElement = wrapper.find('[role="alert"]')
      expect(alertElement.exists()).toBeTruthy()
      expect(alertElement.text()).toContain('Copied')
    })
  })
})
