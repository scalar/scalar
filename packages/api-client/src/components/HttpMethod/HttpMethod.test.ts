import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HttpMethod from './HttpMethod.vue'

describe('HttpMethod', () => {
  describe('display mode', () => {
    it('renders the short label for the QUERY method', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'query' },
      })

      expect(wrapper.text()).toBe('QUERY')
    })

    it('normalizes casing for the QUERY method', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'QUERY' },
      })

      expect(wrapper.text()).toBe('QUERY')
    })
  })

  describe('editable dropdown', () => {
    it('emits the query method when it is selected', () => {
      const wrapper = mount(HttpMethod, {
        props: { method: 'get', isEditable: true },
      })

      // Simulate the listbox selecting the QUERY option
      const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
      listbox.vm.$emit('update:modelValue', { id: 'query', label: 'QUERY' })

      expect(wrapper.emitted('change')?.[0]).toEqual(['query'])
    })
  })
})
