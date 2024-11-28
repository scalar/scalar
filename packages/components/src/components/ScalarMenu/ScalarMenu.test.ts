import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { ScalarMenu } from './'

describe('ScalarMenu', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarMenu)
    expect(wrapper.find('input')).toBeDefined()
  })
})
