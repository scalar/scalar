import type { TestResult } from '@/libs/execute-scripts'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TestResults from './TestResults.vue'

const results: TestResult[] = [
  { title: 'Test 1', success: true, status: 'success', duration: 100 },
  { title: 'Test 2', success: false, status: 'failure', duration: 200 },
  { title: 'Test 3', success: false, status: 'pending', duration: 300 },
]

describe('TestResults', () => {
  it('doesn’t render when no results are provided', () => {
    const wrapper = mount(TestResults, {
      props: {
        results: undefined,
      },
    })

    expect(wrapper.text()).toBe('')
  })

  it('renders test results when provided', () => {
    const wrapper = mount(TestResults, {
      props: {
        results,
      },
    })

    expect(wrapper.text()).toContain('Tests')

    // Check if all test items are rendered
    expect(wrapper.text()).toContain('Test 1')
    expect(wrapper.text()).toContain('Test 2')
    expect(wrapper.text()).toContain('Test 3')

    // Check if summary is rendered
    expect(wrapper.text()).toContain('1/3')
    expect(wrapper.text()).toContain('1 Pending')
  })

  it('shows correct durations for each test', () => {
    const wrapper = mount(TestResults, {
      props: {
        results,
      },
    })

    expect(wrapper.text()).toContain('100 ms')
    expect(wrapper.text()).toContain('200 ms')
    expect(wrapper.text()).toContain('300 ms')
  })

  it('calculates total duration correctly', () => {
    const wrapper = mount(TestResults, {
      props: {
        results,
      },
    })

    expect(wrapper.text()).toContain('600.0 ms')
  })

  it('displays the correct test summary', () => {
    const wrapper = mount(TestResults, {
      props: {
        results,
      },
    })

    expect(wrapper.text()).toContain('1/3')
  })
})
