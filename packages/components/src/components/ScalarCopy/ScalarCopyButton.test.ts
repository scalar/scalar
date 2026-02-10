import { ScalarIconCheck, ScalarIconCopy } from '@scalar/icons'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ScalarCopyButton from './ScalarCopyButton.vue'

describe('ScalarCopyButton', () => {
  describe('rendering', () => {
    it('renders with copy icon by default', () => {
      const wrapper = mount(ScalarCopyButton)
      const iconComponent = wrapper.findComponent(ScalarIconCopy)
      expect(iconComponent.exists()).toBeTruthy()
    })

    it('renders with check icon when copied is true', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: true },
      })
      await nextTick()
      const iconComponent = wrapper.findComponent(ScalarIconCheck)
      expect(iconComponent.exists()).toBeTruthy()
    })
  })

  describe('click behavior', () => {
    it('shows check icon when copied model is true', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: false },
      })

      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeFalsy()

      await wrapper.setProps({ copied: true })
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeFalsy()
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
    it('updates icon when copied changes externally', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: false },
      })

      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeTruthy()

      await wrapper.setProps({ copied: true })
      await nextTick()

      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()
      expect(wrapper.findComponent(ScalarIconCopy).exists()).toBeFalsy()
    })

    it('updates icon when copied changes from true to false', async () => {
      const wrapper = mount(ScalarCopyButton, {
        props: { copied: true },
      })

      await nextTick()
      expect(wrapper.findComponent(ScalarIconCheck).exists()).toBeTruthy()

      await wrapper.setProps({ copied: false })
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
        props: { copied: true },
      })

      await nextTick()

      const alertElement = wrapper.find('[role="alert"]')
      expect(alertElement.exists()).toBeTruthy()
      expect(alertElement.text()).toContain('Copied')
    })
  })
})
