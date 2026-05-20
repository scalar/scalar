import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarVirtualTextSearch from './ScalarVirtualTextSearch.vue'

const defaultProps = {
  query: '',
  matchCount: 0,
  activeMatchIndex: 0,
}

describe('ScalarVirtualTextSearch', () => {
  it('renders an input with the query value', () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, query: 'hello' },
    })

    const input = wrapper.find('input')
    expect(input.element.value).toBe('hello')
  })

  it('emits update:query when the input value changes', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: defaultProps,
    })

    await wrapper.find('input').setValue('test')

    expect(wrapper.emitted('update:query')?.[0]).toStrictEqual(['test'])
  })

  it('does not show match count when query is empty', () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, query: '', matchCount: 5 },
    })

    expect(wrapper.text().includes('of')).toBe(false)
    expect(wrapper.text().includes('No results')).toBe(false)
  })

  it('shows "No results" when query is set but matchCount is 0', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, matchCount: 0 },
    })

    // Set input so localQuery is truthy
    await wrapper.find('input').setValue('xyz')

    expect(wrapper.text()).toContain('No results')
  })

  it('shows "1 of 3" when there are matches', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, query: 'foo', matchCount: 3, activeMatchIndex: 0 },
    })

    // Set input so localQuery is truthy and counter renders
    await wrapper.find('input').setValue('foo')

    expect(wrapper.text()).toContain('1 of 3')
  })

  it('shows "2 of 5" for activeMatchIndex=1 and matchCount=5', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, query: 'bar', matchCount: 5, activeMatchIndex: 1 },
    })

    await wrapper.find('input').setValue('bar')

    expect(wrapper.text()).toContain('2 of 5')
  })

  it('disables prev/next buttons when matchCount is 0', () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, matchCount: 0 },
    })

    const buttons = wrapper.findAll('button')
    const prevButton = buttons.find((b) => b.attributes('aria-label') === 'Previous match')
    const nextButton = buttons.find((b) => b.attributes('aria-label') === 'Next match')

    expect(prevButton?.attributes('disabled')).toBe('')
    expect(nextButton?.attributes('disabled')).toBe('')
  })

  it('enables prev/next buttons when matchCount > 0', () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, matchCount: 3 },
    })

    const buttons = wrapper.findAll('button')
    const prevButton = buttons.find((b) => b.attributes('aria-label') === 'Previous match')
    const nextButton = buttons.find((b) => b.attributes('aria-label') === 'Next match')

    expect(prevButton?.attributes('disabled')).toBeUndefined()
    expect(nextButton?.attributes('disabled')).toBeUndefined()
  })

  it('emits prev when clicking the previous button', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, matchCount: 2 },
    })

    const prevButton = wrapper.findAll('button').find((b) => b.attributes('aria-label') === 'Previous match')

    await prevButton?.trigger('click')

    expect(wrapper.emitted('prev')?.length).toBe(1)
  })

  it('emits next when clicking the next button', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: { ...defaultProps, matchCount: 2 },
    })

    const nextButton = wrapper.findAll('button').find((b) => b.attributes('aria-label') === 'Next match')

    await nextButton?.trigger('click')

    expect(wrapper.emitted('next')?.length).toBe(1)
  })

  it('emits close when clicking the close button', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: defaultProps,
    })

    const closeButton = wrapper.findAll('button').find((b) => b.attributes('aria-label') === 'Close search')

    await closeButton?.trigger('click')

    expect(wrapper.emitted('close')?.length).toBe(1)
  })

  it('emits next on Enter keydown in the input', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: defaultProps,
    })

    await wrapper.find('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('next')?.length).toBe(1)
    expect(wrapper.emitted('prev')).toBeUndefined()
  })

  it('emits prev on Shift+Enter keydown in the input', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: defaultProps,
    })

    await wrapper.find('input').trigger('keydown', { key: 'Enter', shiftKey: true })

    expect(wrapper.emitted('prev')?.length).toBe(1)
    expect(wrapper.emitted('next')).toBeUndefined()
  })

  it('emits close on Escape keydown in the input', async () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: defaultProps,
    })

    await wrapper.find('input').trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('close')?.length).toBe(1)
  })

  it('has accessible labels on all buttons', () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: defaultProps,
    })

    const labels = wrapper.findAll('button').map((b) => b.attributes('aria-label'))

    expect(labels).toStrictEqual(['Previous match', 'Next match', 'Close search'])
  })

  it('has an accessible label on the search input', () => {
    const wrapper = mount(ScalarVirtualTextSearch, {
      props: defaultProps,
    })

    expect(wrapper.find('input').attributes('aria-label')).toBe('Search in text')
  })
})
