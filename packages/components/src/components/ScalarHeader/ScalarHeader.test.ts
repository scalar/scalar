import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ScalarHeader from './ScalarHeader.vue'

describe('ScalarHeader', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders its contents', () => {
    const wrapper = mount(ScalarHeader, {
      slots: { default: 'Hello Vitest' },
    })

    expect(wrapper.text()).toContain('Hello Vitest')
  })

  it('renders a header landmark by default', () => {
    const wrapper = mount(ScalarHeader)

    expect(wrapper.element.tagName).toBe('HEADER')
  })

  it('renders a different element when `is` is set', () => {
    const wrapper = mount(ScalarHeader, { props: { is: 'div' } })

    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('warns when a consumer passes the removed layout slots', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mount(ScalarHeader, { slots: { start: 'Menu' } })

    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toContain('ScalarHeaderColumn')
  })

  it('stays quiet for the composed API', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mount(ScalarHeader, { slots: { default: 'Composed' } })

    expect(warn).not.toHaveBeenCalled()
  })
})
