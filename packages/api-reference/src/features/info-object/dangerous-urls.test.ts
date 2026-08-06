import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ExternalDocs from '@/features/external-docs/ExternalDocs.vue'

import Contact from './Contact.vue'
import InfoLink from './InfoLink.vue'
import License from './License.vue'
import TermsOfService from './TermsOfService.vue'

/**
 * URL values in these components come straight from the OpenAPI document, which is untrusted
 * input. Rendering them into an `href` without a protocol check turns a document into a way to run
 * script in whatever page embeds the API reference.
 */
const DANGEROUS_URL = 'javascript:alert(document.domain)'
const SAFE_URL = 'https://example.com/docs'

describe('dangerous-urls', () => {
  describe('License', () => {
    it('renders a link for a safe url', () => {
      const wrapper = mount(License, {
        props: { value: { name: 'MIT', url: SAFE_URL } },
      })

      expect(wrapper.find('a').attributes('href')).toBe(SAFE_URL)
    })

    it('does not render a link for a javascript url', () => {
      const wrapper = mount(License, {
        props: { value: { name: 'MIT', url: DANGEROUS_URL } },
      })

      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.html()).not.toContain('javascript:')
      expect(wrapper.text()).toContain('MIT')
    })
  })

  describe('TermsOfService', () => {
    it('renders a link for a safe url', () => {
      const wrapper = mount(TermsOfService, { props: { value: SAFE_URL } })

      expect(wrapper.find('a').attributes('href')).toBe(SAFE_URL)
    })

    it('does not render a link for a javascript url', () => {
      const wrapper = mount(TermsOfService, { props: { value: DANGEROUS_URL } })

      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.html()).not.toContain('javascript:')
    })
  })

  describe('Contact', () => {
    it('renders a link for a safe url', () => {
      const wrapper = mount(Contact, {
        props: { value: { name: 'Support', url: SAFE_URL } },
      })

      expect(wrapper.find('a').attributes('href')).toBe(SAFE_URL)
    })

    it('does not render a link for a javascript url', () => {
      const wrapper = mount(Contact, {
        props: { value: { name: 'Support', url: DANGEROUS_URL } },
      })

      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.html()).not.toContain('javascript:')
      expect(wrapper.text()).toContain('Support')
    })
  })

  describe('InfoLink', () => {
    it('renders a link for a safe url', () => {
      const wrapper = mount(InfoLink, {
        props: { name: 'Privacy', url: SAFE_URL },
      })

      expect(wrapper.find('a').attributes('href')).toBe(SAFE_URL)
    })

    it('does not render a link for a javascript url', () => {
      const wrapper = mount(InfoLink, {
        props: { name: 'Privacy', url: DANGEROUS_URL },
      })

      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.html()).not.toContain('javascript:')
      expect(wrapper.text()).toContain('Privacy')
    })
  })

  describe('ExternalDocs', () => {
    it('renders a link for a safe url', () => {
      const wrapper = mount(ExternalDocs, {
        props: { value: { description: 'Docs', url: SAFE_URL } },
      })

      expect(wrapper.find('a').attributes('href')).toBe(SAFE_URL)
    })

    it('does not render a link for a javascript url', () => {
      const wrapper = mount(ExternalDocs, {
        props: { value: { description: 'Docs', url: DANGEROUS_URL } },
      })

      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.html()).not.toContain('javascript:')
      expect(wrapper.text()).toContain('Docs')
    })
  })

  describe('control character bypasses', () => {
    it.each([
      'java\tscript:alert(1)',
      'java\nscript:alert(1)',
      ' javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<script>alert(1)</script>',
    ])('does not render a link for %j', (url) => {
      const wrapper = mount(License, { props: { value: { name: 'MIT', url } } })

      expect(wrapper.find('a').exists()).toBe(false)
    })
  })
})
