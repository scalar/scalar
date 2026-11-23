import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarCodeBlockCopy from './ScalarCodeBlockCopy.vue'

describe('ScalarCodeBlockCopy', () => {
  it('names the button with the visible language while the label is hidden', () => {
    const wrapper = mount(ScalarCodeBlockCopy, {
      props: { content: 'x', lang: 'shell', showLang: true },
    })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Copy Shell code')
    // The visible word stays part of the name (WCAG 2.5.3)
    expect(wrapper.text()).toContain('Copy')
  })

  it('falls back to a generic name without a language', () => {
    const wrapper = mount(ScalarCodeBlockCopy, {
      props: { content: 'x' },
    })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Copy code')
  })

  it('prefers the copyLabel prop', () => {
    const wrapper = mount(ScalarCodeBlockCopy, {
      props: { content: 'x', lang: 'shell', showLang: true, copyLabel: 'Copy request body' },
    })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Copy request body')
  })

  it('lets a consumer supplied aria-label attribute win', () => {
    const wrapper = mount(ScalarCodeBlockCopy, {
      props: { content: 'x', lang: 'shell', showLang: true },
      attrs: { 'aria-label': 'Override' },
    })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Override')
  })
})
