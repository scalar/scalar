import { ScalarCodeBlockCopy } from '@scalar/components/code-block'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResponseBodyRaw from './ResponseBodyRaw.vue'

describe('ResponseBodyRaw', () => {
  it('toggles wrapping without losing keyboard focus or changing the response text', async () => {
    const wrapper = mount(ResponseBodyRaw, {
      attachTo: document.body,
      props: { content: 'long response body' },
    })
    try {
      const button = wrapper.get<HTMLButtonElement>('button[aria-label="Wrap lines"]')
      button.element.focus()

      await button.trigger('click')
      expect(document.activeElement).toBe(button.element)
      expect(button.attributes('aria-pressed')).toBe('true')
      expect(wrapper.get('[role="group"]').text()).toBe('long response body')

      await button.trigger('click')
      expect(document.activeElement).toBe(button.element)
      expect(button.attributes('aria-pressed')).toBe('false')
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps the original whitespace and large integer literals available to copy', () => {
    const content = '{ "id":9007199254740993, "items":[] }\r\n'
    const wrapper = mount(ResponseBodyRaw, { props: { content, language: 'json' } })
    try {
      expect(wrapper.get('code').text()).toBe(content.trim())
      expect(wrapper.getComponent(ScalarCodeBlockCopy).props('content')).toBe(content)
    } finally {
      wrapper.unmount()
    }
  })

  it('formats JSON Preview without changing integer literals', () => {
    const wrapper = mount(ResponseBodyRaw, {
      props: { content: '{"id":9007199254740993}', language: 'json', prettyPrintJson: true },
    })
    try {
      expect(wrapper.get('code').text()).toContain('9007199254740993')
      expect(wrapper.get('button[aria-label="Toggle code fold at line 1"]').attributes('aria-expanded')).toBe('true')
    } finally {
      wrapper.unmount()
    }
  })

  it('renders CR-delimited wire text on separate lines and copies the original bytes', () => {
    const content = '{\r  "a": 1\r}'
    const wrapper = mount(ResponseBodyRaw, { props: { content, language: 'json' } })
    try {
      expect(wrapper.get('button[aria-label="Toggle code fold at line 1"]').attributes('aria-expanded')).toBe('true')
      expect(wrapper.getComponent(ScalarCodeBlockCopy).props('content')).toBe(content)
      const buttons = wrapper.findAll('button')
      expect(buttons[0]?.attributes('aria-label')).toBe('Wrap lines')
      expect(buttons[1]?.attributes('aria-label')).toBe('Copy response body')
    } finally {
      wrapper.unmount()
    }
  })
})
