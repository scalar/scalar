import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarSearchResultList from './ScalarSearchResultList.vue'

describe('ScalarButton', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarSearchResultList)
    expect(wrapper.find('input')).toBeDefined()
  })
})
