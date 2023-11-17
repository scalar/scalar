import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarLoading, { useLoadingState } from './ScalarLoading.vue'

describe('ScalarIconButton', () => {
  it('renders properly', async () => {
    const loadingState = useLoadingState()
    loadingState.startLoading()

    const wrapper = mount(ScalarLoading, { props: { loadingState } })

    expect(wrapper.html({ raw: true })).toBe(
      `<div data-v-845ab52a="" class="loader-wrapper"><svg data-v-845ab52a="" class="svg-loader" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path class="svg-path svg-check-mark" d="m 0 60 l 30 30 l 70 -80" data-v-845ab52a=""></path><path class="svg-path svg-x-mark" d="m 50 50 l 40 -40" data-v-845ab52a=""></path><path class="svg-path svg-x-mark" d="m 50 50 l 40 40" data-v-845ab52a=""></path><path class="svg-path svg-x-mark" d="m 50 50 l -40 -40" data-v-845ab52a=""></path><path class="svg-path svg-x-mark" d="m 50 50 l -40 40" data-v-845ab52a=""></path><g data-v-845ab52a="" class="circular-loader"><circle data-v-845ab52a="" class="loader-path" cx="50" cy="50" fill="none" r="20" stroke-width="2"></circle></g></svg></div>`,
    )
  })
})
