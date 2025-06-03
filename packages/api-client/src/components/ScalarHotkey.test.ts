import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScalarHotkey from './ScalarHotkey.vue'

describe('ScalarHotkey', () => {
  describe('rendering', () => {
    it('renders with default modifier', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
        },
      })

      const visualText = wrapper.find('[aria-hidden="true"]')
      expect(visualText.text()).toBe('^ K')
    })

    it('renders with custom modifier', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Shift'],
        },
      })

      const visualText = wrapper.find('[aria-hidden="true"]')
      expect(visualText.text()).toBe('⇧ K')
    })

    it('renders multiple modifiers', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta', 'Shift'],
        },
      })

      const visualText = wrapper.find('[aria-hidden="true"]')
      expect(visualText.text()).toBe('^+⇧ K')
    })
  })

  describe('platform-specific behavior', () => {
    it('uses Command symbol (⌘) for macOS', () => {
      const oldUserAgent = global.navigator.userAgent

      // Mock modern userAgentData API
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgentData: {
            platform: 'macOS',
          },
        },
      })

      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta'],
        },
      })

      const visualText = wrapper.find('[aria-hidden="true"]')
      expect(visualText.text()).toBe('⌘ K')

      Object.defineProperty(global, 'navigator', {
        value: {
          userAgentData: {
            platform: oldUserAgent,
          },
        },
      })
    })

    it('uses Control symbol (^) for non-macOS', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta'],
        },
      })

      const visualText = wrapper.find('[aria-hidden="true"]')
      expect(visualText.text()).toBe('^ K')
    })
  })

  describe('accessibility', () => {
    it('provides correct screen reader text for simple hotkey', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta'],
        },
      })

      const srElement = wrapper.find('.sr-only')
      expect(srElement.text()).toBe('Control K')
    })

    it('provides correct screen reader text for special keys', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: '↵',
          modifier: ['Meta'],
        },
      })

      const srElement = wrapper.find('.sr-only')
      expect(srElement.text()).toBe('Control Enter')
    })

    it('provides correct screen reader text for multiple modifiers', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta', 'Shift'],
        },
      })

      const srElement = wrapper.find('.sr-only')
      expect(srElement.text()).toBe('Control+Shift K')
    })
  })

  describe('edge cases', () => {
    it('handles unknown special keys gracefully', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: '$',
          modifier: ['Meta'],
        },
      })

      const visualText = wrapper.find('[aria-hidden="true"]')
      const srElement = wrapper.find('.sr-only')
      expect(visualText.text()).toBe('^ $')
      expect(srElement.text()).toBe('Control $')
    })

    it('handles empty modifier array', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: [],
        },
      })

      const srElement = wrapper.find('.sr-only')
      const visualText = wrapper.find('[aria-hidden="true"]')
      expect(visualText.text()).toBe('K')
      expect(srElement.text()).toBe('K')
    })
  })
})
