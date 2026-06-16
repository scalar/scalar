import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import InfoLink from './InfoLink.vue'

describe('InfoLink', () => {
  it('renders a named link that opens in a new tab', () => {
    const wrapper = mount(InfoLink, {
      props: { name: 'Privacy Policy', url: 'https://example.com/privacy' },
    })

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('https://example.com/privacy')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.text()).toBe('Privacy Policy')
  })

  it('matches the rendered markup', () => {
    const wrapper = mount(InfoLink, {
      props: { name: 'Imprint', url: 'https://example.com/imprint' },
    })

    expect(wrapper.html()).toMatchSnapshot()
  })
})
