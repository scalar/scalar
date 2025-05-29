import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarMarkdown from './ScalarMarkdown.vue'

describe('ScalarMarkdown', () => {
  it('renders properly with basic markdown', () => {
    const wrapper = mount(ScalarMarkdown, {
      props: {
        value:
          '# Scalar Galaxy\n\nThe Scalar Galaxy is an example OpenAPI specification to test OpenAPI tools and libraries.',
      },
    })

    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Scalar Galaxy')
    expect(wrapper.find('p').exists()).toBe(true)
    expect(wrapper.find('p').text()).toBe(
      'The Scalar Galaxy is an example OpenAPI specification to test OpenAPI tools and libraries.',
    )
  })

  it('applies custom class', () => {
    const wrapper = mount(ScalarMarkdown, {
      props: {
        value: '# Get all planets',
        class: 'operation-description',
      },
    })

    expect(wrapper.find('div').classes()).toContain('operation-description')
  })

  describe('withAnchors functionality', () => {
    it('does not add anchors when withAnchors is false', () => {
      const wrapper = mount(ScalarMarkdown, {
        props: {
          value: "# Physical Properties\n\nDetailed information about the planet's physical characteristics.",
          withAnchors: false,
        },
      })

      const heading = wrapper.find('h1')
      expect(heading.exists()).toBe(true)
      expect(heading.attributes('id')).toBeUndefined()
    })

    it('adds anchors when withAnchors is true', () => {
      const wrapper = mount(ScalarMarkdown, {
        props: {
          value: "# Physical Properties\n\nDetailed information about the planet's physical characteristics.",
          withAnchors: true,
          transformType: 'heading',
        },
      })

      const heading = wrapper.find('h1')
      expect(heading.exists()).toBe(true)
      expect(heading.attributes('id')).toBe('physical-properties')
    })

    it('adds anchors with prefix when anchorPrefix is provided', () => {
      const wrapper = mount(ScalarMarkdown, {
        props: {
          value: '# Atmosphere Composition\n\nInformation about the atmospheric gases.',
          withAnchors: true,
          anchorPrefix: 'tag/planets/PUT/planets/{planetId}',
          transformType: 'heading',
        },
      })

      const heading = wrapper.find('h1')
      expect(heading.exists()).toBe(true)
      expect(heading.attributes('id')).toBe('tag/planets/PUT/planets/{planetId}/description/atmosphere-composition')
    })

    it('handles multiple headings with anchors', () => {
      const wrapper = mount(ScalarMarkdown, {
        props: {
          value:
            "# Planet Details\n\n## Physical Properties\n\n### Temperature Range\n\nThe planet's temperature varies significantly.",
          withAnchors: true,
          transformType: 'heading',
        },
      })

      const h1 = wrapper.find('h1')
      const h2 = wrapper.find('h2')
      const h3 = wrapper.find('h3')

      expect(h1.attributes('id')).toBe('planet-details')
      expect(h2.attributes('id')).toBe('physical-properties')
      expect(h3.attributes('id')).toBe('temperature-range')
    })

    it('handles headings with special characters in slug generation', () => {
      const wrapper = mount(ScalarMarkdown, {
        props: {
          value: '# Planet HD 40307g & Its Moons!\n\nA super-earth exoplanet.',
          withAnchors: true,
          transformType: 'heading',
        },
      })

      const heading = wrapper.find('h1')
      expect(heading.attributes('id')).toBe('planet-hd-40307g-&-its-moons!')
    })
  })

  it('includes images when withImages is true', () => {
    const wrapper = mount(ScalarMarkdown, {
      props: {
        value:
          '![Jupiter with Great Red Spot](https://cdn.scalar.com/photos/jupiter.jpg)\n\nA gas giant with a distinctive storm.',
        withImages: true,
      },
    })

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('alt')).toBe('Jupiter with Great Red Spot')
    expect(wrapper.find('img').attributes('src')).toBe('https://cdn.scalar.com/photos/jupiter.jpg')
  })
})
