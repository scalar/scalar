import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarLoading, { useLoadingState } from './ScalarLoading.vue'

describe('ScalarLoading', () => {
  it('renders properly', async () => {
    const loadingState = useLoadingState()
    loadingState.startLoading()

    const wrapper = mount(ScalarLoading, { props: { loadingState } })

    expect(wrapper.find('svg').exists()).toBeTruthy()
  })
})
