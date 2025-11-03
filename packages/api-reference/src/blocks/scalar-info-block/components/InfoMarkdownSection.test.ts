import { ScalarMarkdown } from '@scalar/components'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import InfoMarkdownSection from './InfoMarkdownSection.vue'

describe('InfoMarkdownSection', () => {
  it('renders markdown content', () => {
    const wrapper = mount(InfoMarkdownSection, {
      props: {
        content: '# Hello World\n\nThis is a test description.',
        transformHeading: (node) => node,
        eventBus: null,
      },
    })

    expect(wrapper.findComponent(ScalarMarkdown).exists()).toBe(true)

    expect(wrapper.html()).toContain('<h1>Hello World</h1>')
    expect(wrapper.html()).toContain('<p>This is a test description.</p>')
  })

  it('renders images in markdown', () => {
    const wrapper = mount(InfoMarkdownSection, {
      props: {
        content: '![Test Image](https://example.com/image.jpg)\n\nSome text with an image.',
        transformHeading: (node) => node,
        eventBus: null,
      },
    })

    expect(wrapper.findComponent(ScalarMarkdown).exists()).toBe(true)

    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('alt')).toBe('Test Image')
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/image.jpg')
  })
})
