import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Contact from './Contact.vue'

describe('Contact', () => {
  it('renders a mailto link for the email', () => {
    const wrapper = mount(Contact, {
      props: { value: { name: 'Support Team', email: 'support@example.com' } },
    })

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('mailto:support@example.com')
    expect(link.text()).toBe('Support Team')
  })

  it('renders an external link for the url', () => {
    const wrapper = mount(Contact, {
      props: { value: { name: 'Support Team', url: 'https://support.example.com' } },
    })

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('https://support.example.com')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.text()).toBe('Support Team')
  })

  it('renders both email and url links when both are provided', () => {
    const wrapper = mount(Contact, {
      props: {
        value: {
          name: 'Support Team',
          email: 'support@example.com',
          url: 'https://support.example.com',
        },
      },
    })

    const links = wrapper.findAll('a')
    expect(links).toHaveLength(2)
    expect(links[0]?.attributes('href')).toBe('mailto:support@example.com')
    expect(links[1]?.attributes('href')).toBe('https://support.example.com')
    // The name labels the email link only, to avoid repeating it
    expect(links[0]?.text()).toBe('Support Team')
    expect(links[1]?.text()).toBe('')
  })

  it('renders the name as plain text when no email or url is provided', () => {
    const wrapper = mount(Contact, {
      props: { value: { name: 'Support Team' } },
    })

    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toBe('Support Team')
  })

  it('renders nothing when value is undefined', () => {
    const wrapper = mount(Contact, { props: {} })

    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })
})
