import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HttpMethod from './HttpMethod.vue'

describe('HttpMethod', () => {
  describe('rendering', () => {
    it('renders with default span element', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'GET' },
      })

      expect(wrapper.element.tagName).toBe('SPAN')
      expect(wrapper.classes()).toContain('uppercase')
    })

    it('renders with custom element type', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'POST', as: 'div' },
      })

      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.classes()).toContain('uppercase')
    })

    it('renders with custom component', () => {
      const CustomComponent = { template: '<button><slot /></button>' }
      const wrapper = mount(HttpMethod, {
        props: { method: 'PUT', as: CustomComponent },
      })

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.classes()).toContain('uppercase')
    })
  })

  describe('HTTP method display', () => {
    it('displays normalized method name when short is false', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'GET' },
      })

      expect(wrapper.text()).toBe('get')
    })

    it('displays normalized method name when short is undefined', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'POST' },
      })

      expect(wrapper.text()).toBe('post')
    })

    it('displays abbreviated method name when short is true', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'DELETE', short: true },
      })

      expect(wrapper.text()).toBe('DEL')
    })

    it('displays abbreviated method name for all methods when short is true', () => {
      const testCases = [
        { method: 'GET', expected: 'GET' },
        { method: 'POST', expected: 'POST' },
        { method: 'PUT', expected: 'PUT' },
        { method: 'PATCH', expected: 'PATCH' },
        { method: 'DELETE', expected: 'DEL' },
        { method: 'OPTIONS', expected: 'OPTS' },
        { method: 'HEAD', expected: 'HEAD' },
        { method: 'CONNECT', expected: 'CONN' },
        { method: 'TRACE', expected: 'TRACE' },
      ]

      testCases.forEach(({ method, expected }) => {
        const wrapper = mount(HttpMethod, {
          props: { method, short: true },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })
  })

  describe('method normalization', () => {
    it('handles case-insensitive method names', () => {
      const testCases = [
        { input: 'get', expected: 'get' },
        { input: 'POST', expected: 'post' },
        { input: 'Put', expected: 'put' },
        { input: 'patch', expected: 'patch' },
        { input: 'Delete', expected: 'delete' },
      ]

      testCases.forEach(({ input, expected }) => {
        const wrapper = mount(HttpMethod, {
          props: { method: input },
        })

        expect(wrapper.text()).toBe(expected)
      })
    })

    it('handles whitespace in method names', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: '  get  ' },
      })

      expect(wrapper.text()).toBe('get')
    })

    it('handles unknown methods gracefully', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'UNKNOWN' },
      })

      expect(wrapper.text()).toBe('get')
    })

    it('handles empty string method', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: '' },
      })

      expect(wrapper.text()).toBe('get')
    })
  })

  describe('slot content', () => {
    it('renders slot content before method text', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'GET' },
        slots: { default: 'API ' },
      })

      expect(wrapper.text()).toBe('API get')
    })

    it('renders slot content with abbreviated method', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'DELETE', short: true },
        slots: { default: 'Remove ' },
      })

      expect(wrapper.text()).toBe('Remove DEL')
    })

    it('renders empty slot content', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'POST' },
        slots: { default: '' },
      })

      expect(wrapper.text()).toBe('post')
    })
  })

  describe('edge cases', () => {
    it('handles null method gracefully', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: null as any },
      })

      expect(wrapper.text()).toBe('get')
    })

    it('handles undefined method gracefully', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: undefined as any },
      })

      expect(wrapper.text()).toBe('get')
    })

    it('handles non-string method gracefully', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 123 as any },
      })

      expect(wrapper.text()).toBe('get')
    })

    it('handles whitespace-only method', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: '   ' },
      })

      expect(wrapper.text()).toBe('get')
    })
  })

  describe('accessibility', () => {
    it('maintains semantic structure with custom element', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'GET', as: 'strong' },
      })

      expect(wrapper.element.tagName).toBe('STRONG')
      expect(wrapper.classes()).toContain('uppercase')
    })

    it('preserves all attributes when using custom component', () => {
      const CustomComponent = {
        template: '<code class="custom-class"><slot /></code>',
      }
      const wrapper = mount(HttpMethod, {
        props: { method: 'POST', as: CustomComponent },
      })

      expect(wrapper.element.tagName).toBe('CODE')
      expect(wrapper.classes()).toContain('uppercase')
      expect(wrapper.classes()).toContain('custom-class')
    })
  })
})
