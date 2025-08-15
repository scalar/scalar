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

      const visualText = wrapper.findAll('[aria-hidden="true"]')
      const visualTextContent = visualText.map((el) => el.text()).join(' ')
      expect(visualTextContent).toBe('ctrl K')
    })

    it('renders with custom modifier', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Shift'],
        },
      })

      const visualText = wrapper.findAll('[aria-hidden="true"]')
      const visualTextContent = visualText.map((el) => el.text()).join(' ')
      expect(visualTextContent).toBe('⇧ K')
    })

    it('renders multiple modifiers', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta', 'Shift'],
        },
      })

      const visualText = wrapper.findAll('[aria-hidden="true"]')
      const visualTextContent = visualText.map((el) => el.text()).join(' ')
      expect(visualTextContent).toBe('ctrl ⇧ K')
    })
  })

  describe('platform-specific behavior', () => {
    it('uses Command symbol (⌘) for macOS', () => {
      const oldUserAgent = global.navigator.userAgent

      // Mock modern userAgentData API
      Object.defineProperty(global, 'navigator', {
        value: { userAgentData: { platform: 'macOS' } },
      })

      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta'],
        },
      })
      const visualText = wrapper.findAll('[aria-hidden="true"]')
      const visualTextContent = visualText.map((el) => el.text()).join(' ')
      expect(visualTextContent).toBe('⌘ K')

      Object.defineProperty(global, 'navigator', {
        value: { userAgentData: { platform: oldUserAgent } },
      })
    })

    it('uses Control symbol (^) for non-macOS', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta'],
        },
      })

      const visualText = wrapper.findAll('[aria-hidden="true"]')
      const visualTextContent = visualText.map((el) => el.text()).join(' ')
      expect(visualTextContent).toBe('ctrl K')
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

      const srContent = wrapper.findAll('.sr-only')
      const srContentText = srContent.map((el) => el.text()).join(' ')
      expect(srContentText).toBe('Control K')
    })

    it('provides correct screen reader text for special keys', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: '↵',
          modifier: ['Meta'],
        },
      })

      const srContent = wrapper.findAll('.sr-only')
      const srContentText = srContent.map((el) => el.text()).join(' ')
      expect(srContentText).toBe('Control Enter')
    })

    it('provides correct screen reader text for multiple modifiers', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: ['Meta', 'Shift'],
        },
      })

      const srContent = wrapper.findAll('.sr-only')
      const srContentText = srContent.map((el) => el.text()).join(' ')
      expect(srContentText).toBe('Control Shift K')
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

      const visualText = wrapper.findAll('[aria-hidden="true"]')
      const visualTextContent = visualText.map((el) => el.text()).join(' ')
      expect(visualTextContent).toBe('ctrl $')

      const srContent = wrapper.findAll('.sr-only')
      const srContentText = srContent.map((el) => el.text()).join(' ')
      expect(srContentText).toBe('Control $')
    })

    it('handles empty modifier array', () => {
      const wrapper = mount(ScalarHotkey, {
        props: {
          hotkey: 'K',
          modifier: [],
        },
      })

      const visualText = wrapper.findAll('[aria-hidden="true"]')
      const visualTextContent = visualText.map((el) => el.text()).join(' ')
      expect(visualTextContent).toBe('K')

      const srContent = wrapper.findAll('.sr-only')
      const srContentText = srContent.map((el) => el.text()).join(' ')
      expect(srContentText).toBe('K')
    })
  })
})
