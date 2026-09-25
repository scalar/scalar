import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CollapsibleSection from './CollapsibleSection.vue'
import { COLLAPSIBLE_SECTION_HEADING_LEVEL } from './collapsible-section-heading-level'

describe('CollapsibleSection', () => {
  const mountSection = (headingLevel?: 2 | 3 | 4 | 5 | 6) =>
    mount(CollapsibleSection, {
      slots: { title: 'Authentication', default: 'Content' },
      global: headingLevel ? { provide: { [COLLAPSIBLE_SECTION_HEADING_LEVEL as symbol]: headingLevel } } : {},
    })

  it('renders the title as a level two heading by default', () => {
    const wrapper = mountSection()

    expect(wrapper.find('h2').text()).toContain('Authentication')
  })

  it('renders the title at the level its parent provides', () => {
    const wrapper = mountSection(3)

    expect(wrapper.find('h3').text()).toContain('Authentication')
    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('does not label the section, so it stays out of the landmark list', () => {
    const wrapper = mountSection()

    // A named section is a region wrapping its own heading, which makes screen
    // readers announce the title twice before reading the contents.
    expect(wrapper.find('section').attributes('aria-labelledby')).toBeUndefined()
  })
})
