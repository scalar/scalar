import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import ScalarErrorBoundary from './ScalarErrorBoundary.vue'

describe('ScalarErrorBoundary', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarErrorBoundary, {
      props: {},
    })

    expect(wrapper.exists()).toBeTruthy()
  })

  it('catches and displays errors from child components', async () => {
    // Test component that throws an error
    const ErrorComponent = {
      setup() {
        throw new Error('Test error message')
      },
      render() {
        return h('div')
      },
    }

    const wrapper = mount(ScalarErrorBoundary, {
      slots: {
        default: () => h(ErrorComponent),
      },
    })

    await nextTick()

    // Error should be caught and displayed
    expect(wrapper.text()).toContain('Oops, something went wrong here')
    expect(wrapper.text()).toContain('Test error message')
  })

  it('renders child components normally when no error occurs', async () => {
    const NormalComponent = {
      template: '<div>Normal content</div>',
    }

    const wrapper = mount(ScalarErrorBoundary, {
      slots: {
        default: () => h(NormalComponent),
      },
    })

    await nextTick()

    // Should show the normal content without error message
    expect(wrapper.text()).toContain('Normal content')
    expect(wrapper.text()).not.toContain('Oops, something went wrong here')
  })
})
