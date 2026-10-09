import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import DocumentSelector from './DocumentSelector.vue'

enableAutoUnmount(afterEach)

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = () => undefined
})

const options = [
  { id: 'users', label: '用户 API' },
  { id: 'billing', label: 'Billing API' },
  { id: '设备', label: '设备 API' },
  { id: 'orders', label: 'Orders API' },
  { id: 'products', label: 'Products API' },
  { id: 'shipping', label: 'Shipping API' },
]

describe('DocumentSelector', () => {
  it('renders and filters multiple documents by Chinese and English titles', async () => {
    const wrapper = mount(DocumentSelector, {
      props: { options, modelValue: 'users' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')

    const input = wrapper.get('input[role="combobox"]')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(6)
    expect(input.attributes('placeholder')).toBe('Search...')
    expect(input.attributes('aria-label')).toBe('Enter search query')

    await input.setValue('billing')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    expect(wrapper.get('[role="option"]').text()).toContain('Billing API')

    await input.setValue('设备')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)
    expect(wrapper.get('[role="option"]').text()).toContain('设备 API')

    await input.setValue('')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(6)
  })

  it('shows an empty state without emitting a selection', async () => {
    const wrapper = mount(DocumentSelector, {
      props: { options, modelValue: 'users' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    const input = wrapper.get('input[role="combobox"]')
    await input.setValue('missing')

    expect(wrapper.get('[role="status"]').text()).toBe('No results found')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it.each([2, 5])('shows documents without a search input for %i entries', async (count) => {
    const wrapper = mount(DocumentSelector, {
      props: { options: options.slice(0, count), modelValue: 'users' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toStrictEqual(
      options.slice(0, count).map((option) => option.label),
    )
  })

  it('keeps the selector hidden for a single document', () => {
    const wrapper = mount(DocumentSelector, {
      props: { options: options.slice(0, 1), modelValue: 'users' },
    })

    expect(wrapper.find('button').exists()).toBe(false)
  })
})
