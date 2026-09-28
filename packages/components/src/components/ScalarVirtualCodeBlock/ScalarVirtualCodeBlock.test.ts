import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarVirtualCodeBlock from './ScalarVirtualCodeBlock.vue'

describe('ScalarVirtualCodeBlock', () => {
  it('names the focusable code region and accepts a contextual label', async () => {
    const wrapper = mount(ScalarVirtualCodeBlock, { props: { content: 'first\nsecond', copy: false } })
    const region = wrapper.get('[role="region"]')

    expect(region.attributes('aria-label')).toBe('Code sample')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.text()).toContain('first')

    await wrapper.setProps({ label: 'Response example' })
    expect(region.attributes('aria-label')).toBe('Response example')
  })
})
