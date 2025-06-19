import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScalarSidebarSearchInput from './ScalarSidebarSearchInput.vue'
import { nextTick } from 'vue'

describe('ScalarSidebarSearchInput', () => {
  it('renders with default props', () => {
    const wrapper = mount(ScalarSidebarSearchInput)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('input').attributes('placeholder')).toBe('Search...')
    expect(wrapper.find('input').attributes('aria-label')).toBe('Enter search query')
  })

  it('renders with custom label', () => {
    const wrapper = mount(ScalarSidebarSearchInput, {
      props: {
        label: 'Custom Search',
      },
    })
    expect(wrapper.find('input').attributes('aria-label')).toBe('Custom Search')
  })

  it('shows clear button when input has value', async () => {
    const wrapper = mount(ScalarSidebarSearchInput)
    const input = wrapper.find('input')

    // Initially no clear button
    expect(wrapper.find('.scalar-icon-button').exists()).toBe(false)

    // After entering text
    await input.setValue('test')
    expect(wrapper.find('.scalar-icon-button').exists()).toBe(true)
  })

  it('clears input when clear button is clicked', async () => {
    const wrapper = mount(ScalarSidebarSearchInput)
    const input = wrapper.find('input')

    await input.setValue('test')
    expect(input.element.value).toBe('test')

    await wrapper.find('.scalar-icon-button').trigger('click')
    expect(input.element.value).toBe('')
  })

  it('does not autofocus input by default', async () => {
    const wrapper = mount(ScalarSidebarSearchInput, {
      attachTo: document.body,
    })

    await nextTick()
    const input = wrapper.find('input').element
    expect(document.activeElement).not.toBe(input)
  })

  it('autofocuses input when autofocus prop is true', async () => {
    const wrapper = mount(ScalarSidebarSearchInput, {
      props: { autofocus: true },
      attachTo: document.body,
    })

    await nextTick()
    const input = wrapper.find('input').element
    expect(document.activeElement).toBe(input)
  })

  it('maintains focus after clearing input', async () => {
    const wrapper = mount(ScalarSidebarSearchInput, {
      attachTo: document.body,
    })
    const input = wrapper.find('input')

    await input.setValue('test')
    await wrapper.find('.scalar-icon-button').trigger('click')

    expect(document.activeElement).toBe(input.element)
  })

  it('applies correct classes based on input state', async () => {
    const wrapper = mount(ScalarSidebarSearchInput)
    const label = wrapper.find('label')

    // Initial state
    expect(label.classes()).toContain('text-sidebar-c-search')

    // With value
    await wrapper.find('input').setValue('test')
    expect(label.classes()).toContain('text-c-1')
  })

  it('forwards additional attributes to input element', () => {
    const wrapper = mount(ScalarSidebarSearchInput, {
      attrs: {
        'data-test': 'search-input',
        disabled: true,
      },
    })

    const input = wrapper.find('input')
    expect(input.attributes('data-test')).toBe('search-input')
    expect(input.attributes('disabled')).toBeDefined()
  })
})
