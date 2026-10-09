import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import HttpMethod from './HttpMethod.vue'

describe('HttpMethod', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it.each(['PURGE', 'pAtCh', 'GET'])('selects the authored %s method in the picker', async (method) => {
    const wrapper = mount(HttpMethod, { attachTo: document.body, props: { method, isEditable: true } })
    await wrapper.get('button').trigger('click')
    await flushPromises()

    const selected = document.querySelector('[role="option"][aria-selected="true"]')
    expect(selected?.textContent?.trim()).toBe(method)
    selected?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('change')).toStrictEqual([[method]])
    wrapper.unmount()
  })

  it('updates the selected option when navigating between custom and fixed methods', async () => {
    const wrapper = mount(HttpMethod, { attachTo: document.body, props: { method: 'PURGE', isEditable: true } })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    const selectedLabel = (): string | undefined =>
      document.querySelector('[role="option"][aria-selected="true"]')?.textContent?.trim()
    const labels = (): (string | undefined)[] =>
      Array.from(document.querySelectorAll('[role="option"]'), (option) => option.textContent?.trim())
    expect(selectedLabel()).toBe('PURGE')

    await wrapper.setProps({ method: 'copy' })
    expect(selectedLabel()).toBe('copy')
    expect(labels().includes('PURGE')).toBe(false)

    await wrapper.setProps({ method: 'get' })
    expect(selectedLabel()).toBe('GET')
    expect(labels().filter((label) => label === 'GET')).toStrictEqual(['GET'])
    wrapper.unmount()
  })
})
