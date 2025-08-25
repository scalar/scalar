import { ScalarMarkdown } from '@scalar/components'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import InfoDescription from './InfoDescription.vue'

describe('InfoDescription', () => {
  it('renders nothing when no description is provided', () => {
    const wrapper = mount(InfoDescription)
    expect(wrapper.find('.introduction-description').exists()).toBe(false)
  })

  it('renders markdown content when description is provided', () => {
    const wrapper = mount(InfoDescription, {
      props: {
        description: '# Hello World',
      },
    })
    expect(wrapper.findComponent(ScalarMarkdown).exists()).toBe(true)
    expect(wrapper.find('.introduction-description').exists()).toBe(true)
  })

  it('splits content into sections', () => {
    const wrapper = mount(InfoDescription, {
      props: {
        description: '# Heading 1\nContent 1\n# Heading 2\nContent 2',
      },
    })
    const sections = wrapper.findAllComponents(ScalarMarkdown)
    expect(sections).toHaveLength(4) // 2 headings + 2 content sections
  })

  it('prefixes the heading section id', () => {
    const wrapper = mount(InfoDescription, {
      props: {
        description: '# Test Heading',
      },
    })
    const observer = wrapper.findComponent({ name: 'IntersectionObserver' })
    expect(observer.attributes('id')).toBe('description/test-heading')
  })
})
