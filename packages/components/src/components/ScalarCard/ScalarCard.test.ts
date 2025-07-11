import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { ScalarCard, ScalarCardSection, ScalarCardFooter, ScalarCardHeader } from './index'
import { nextTick } from 'vue'

describe('ScalarCard', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarCard, {
      slots: {
        default: 'Card content',
      },
    })
    expect(wrapper.text()).toContain('Card content')
  })

  it('sets aria-label when label prop is provided', () => {
    const wrapper = mount(ScalarCard, {
      props: {
        label: 'Test card',
      },
    })
    expect(wrapper.find('section').attributes('aria-label')).toBe('Test card')
    expect(wrapper.find('section').attributes('aria-labelledby')).not.toBeDefined()
  })

  it('sets aria-labelledby when card header is present', async () => {
    const wrapper = mount(ScalarCard, {
      slots: {
        default: ['<ScalarCardHeader>Header</ScalarCardHeader>', '<ScalarCardSection>Content</ScalarCardSection>'],
      },
      global: {
        components: {
          ScalarCardHeader,
          ScalarCardSection,
        },
      },
    })

    // Wait for the ref to propagate
    await nextTick()

    const section = wrapper.find('section')
    expect(section.attributes('aria-labelledby')).toBeDefined()
  })
})

describe('ScalarCardHeader', () => {
  it('renders header content', () => {
    const wrapper = mount(ScalarCardHeader, {
      slots: {
        default: 'Header text',
      },
    })
    expect(wrapper.text()).toContain('Header text')
  })

  it('renders actions slot when provided', () => {
    const wrapper = mount(ScalarCardHeader, {
      slots: {
        default: 'Header text',
        actions: '<button>Action</button>',
      },
    })
    expect(wrapper.html()).toContain('<button>Action</button>')
  })
})

describe('ScalarCardSection', () => {
  it('renders content properly', () => {
    const wrapper = mount(ScalarCardSection, {
      slots: {
        default: 'Content text',
      },
    })
    expect(wrapper.text()).toContain('Content text')
  })
})

describe('ScalarCardFooter', () => {
  it('renders footer content', () => {
    const wrapper = mount(ScalarCardFooter, {
      slots: {
        default: 'Footer text',
      },
    })
    expect(wrapper.text()).toContain('Footer text')
  })
})
