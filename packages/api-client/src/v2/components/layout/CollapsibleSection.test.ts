import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CollapsibleSection from './CollapsibleSection.vue'
import { COLLAPSIBLE_SECTION_HEADING_LEVEL } from './collapsible-section-heading-level'

describe('CollapsibleSection', () => {
  const mountSection = (headingLevel?: 2 | 3 | 4 | 5 | 6, props: { heading?: boolean } = {}) =>
    mount(CollapsibleSection, {
      props,
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

  it('does not label a section that carries a heading, so it stays out of the landmark list', () => {
    const wrapper = mountSection()

    // A named section is a region wrapping its own heading, which makes screen
    // readers announce the title twice before reading the contents.
    const section = wrapper.find('section')
    expect(section.attributes('aria-labelledby')).toBeUndefined()
    expect(section.attributes('role')).toBeUndefined()
  })

  it('renders the title as plain text when the caller opts out of the heading', () => {
    const wrapper = mountSection(undefined, { heading: false })

    expect(wrapper.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false)
    expect(wrapper.text()).toContain('Authentication')
  })

  it('names the section as a group when the caller opts out of the heading', () => {
    const wrapper = mountSection(undefined, { heading: false })

    // `group` is not a landmark, so the card gains a name without the title
    // appearing in either the landmark list or the heading outline.
    const section = wrapper.get('section')
    expect(section.attributes('role')).toBe('group')

    const labelId = section.attributes('aria-labelledby')
    expect(labelId).toBeTruthy()
    expect(wrapper.get(`[id="${labelId}"]`).text()).toContain('Authentication')
  })

  it('keeps the title classes identical whether or not it is a heading', () => {
    const headingClasses = mountSection().get('h2').attributes('class')

    const plain = mountSection(undefined, { heading: false })
    const labelId = plain.get('section').attributes('aria-labelledby')

    expect(plain.get(`[id="${labelId}"]`).attributes('class')).toBe(headingClasses)
  })
})
