import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarFormInput from './ScalarFormInput.vue'

describe('ScalarFormInput', () => {
  it('renders as a button by default with type="button" and handles click', async () => {
    const onClick = vi.fn()
    const wrapper = mount(ScalarFormInput, {
      attrs: { onClick },
      slots: { default: 'Click me' },
    })

    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')

    await button.trigger('click')
    expect(onClick).toHaveBeenCalled()
  })

  it('renders as an input and forwards attributes', () => {
    const wrapper = mount(ScalarFormInput, {
      props: { is: 'input' },
      attrs: { placeholder: 'Enter text', type: 'email' },
    })

    const input = wrapper.get('input')
    expect(input.attributes('placeholder')).toBe('Enter text')
    // When used as an input, type can be provided via attrs and should be respected
    expect(input.attributes('type')).toBe('email')
  })

  it('renders as a label and forwards attributes and slot content', () => {
    const wrapper = mount(ScalarFormInput, {
      props: { is: 'label' },
      attrs: { for: 'my-input' },
      slots: { default: 'My Label' },
    })

    const label = wrapper.get('label')
    expect(label.attributes('for')).toBe('my-input')
    expect(label.text()).toBe('My Label')
  })

  it('renders as a div and forwards arbitrary attributes and slot content', () => {
    const wrapper = mount(ScalarFormInput, {
      props: { is: 'div' },
      attrs: { 'data-testid': 'container', class: 'custom-class' },
      slots: { default: '<span>Content</span>' },
    })

    const div = wrapper.get('div[data-testid="container"]')
    expect(div.text()).toContain('Content')
    // Class merging is handled internally; ensure provided class is present
    expect(div.classes()).toContain('custom-class')
  })
})
