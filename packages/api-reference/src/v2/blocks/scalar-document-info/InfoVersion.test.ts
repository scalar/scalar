import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InfoVersion from './InfoVersion.vue'

describe('InfoVersion', () => {
  describe('version formatting', () => {
    it('adds v prefix to numeric string versions', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '1.0.0' },
      })

      expect(wrapper.text()).toBe('v1.0.0')
    })

    it('adds v prefix to numeric string versions starting with zero', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '0.1.0' },
      })

      expect(wrapper.text()).toBe('v0.1.0')
    })

    it('does not add v prefix to non-numeric string versions', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: 'alpha' },
      })

      expect(wrapper.text()).toBe('alpha')
    })

    it('does not add v prefix to versions starting with letters', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: 'beta-1.0' },
      })

      expect(wrapper.text()).toBe('beta-1.0')
    })

    it('does not add v prefix to versions starting with special characters', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '~1.0.0' },
      })

      expect(wrapper.text()).toBe('~1.0.0')
    })
  })

  describe('edge cases', () => {
    it('handles empty string version', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '' },
      })

      expect(wrapper.text()).toBe('')
    })
  })

  describe('badge rendering', () => {
    it('renders badge when version is valid', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '1.0.0' },
      })

      expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(true)
    })

    it('passes correct text content to badge', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '2.1.0' },
      })

      expect(wrapper.text()).toBe('v2.1.0')
    })
  })

  describe('complex version strings', () => {
    it('handles semantic versioning with prerelease', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '1.0.0-beta.1' },
      })

      expect(wrapper.text()).toBe('v1.0.0-beta.1')
    })

    it('handles semantic versioning with build metadata', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '1.0.0+build.123' },
      })

      expect(wrapper.text()).toBe('v1.0.0+build.123')
    })

    it('handles version with multiple dots', () => {
      const wrapper = mount(InfoVersion, {
        props: { version: '1.2.3.4' },
      })

      expect(wrapper.text()).toBe('v1.2.3.4')
    })
  })
})
