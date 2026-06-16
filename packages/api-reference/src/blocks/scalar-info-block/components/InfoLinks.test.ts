import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import InfoLinks from './InfoLinks.vue'

describe('InfoLinks', () => {
  const mockInfo = {
    title: 'Test API',
    version: '1.0.0',
  }

  const mockContact = {
    name: 'API Support',
    email: 'support@example.com',
  }

  const mockLicense = {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  }

  const mockTermsOfService = 'https://example.com/terms'

  const mockExternalDocs = {
    description: 'External documentation',
    url: 'https://docs.example.com',
  }

  it('renders LinkList wrapper when a link is present', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: mockInfo, externalDocs: mockExternalDocs },
    })

    expect(wrapper.findComponent({ name: 'LinkList' }).exists()).toBe(true)
  })

  it('does not render LinkList when there are no links', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: mockInfo },
    })

    expect(wrapper.findComponent({ name: 'LinkList' }).exists()).toBe(false)
  })

  it('renders ExternalDocs with externalDocs prop', () => {
    const wrapper = mount(InfoLinks, {
      props: {
        info: mockInfo,
        externalDocs: mockExternalDocs,
      },
    })

    const externalDocs = wrapper.findComponent({ name: 'ExternalDocs' })
    expect(externalDocs.exists()).toBe(true)
    expect(externalDocs.props('value')).toEqual(mockExternalDocs)
  })

  it('does not render ExternalDocs without externalDocs prop', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: { ...mockInfo, contact: mockContact } },
    })

    expect(wrapper.findComponent({ name: 'ExternalDocs' }).exists()).toBe(false)
  })

  it('renders Contact when info.contact is provided', () => {
    const wrapper = mount(InfoLinks, {
      props: {
        info: { ...mockInfo, contact: mockContact },
      },
    })

    const contact = wrapper.findComponent({ name: 'Contact' })
    expect(contact.exists()).toBe(true)
    expect(contact.props('value')).toEqual(mockContact)
  })

  it('does not render Contact when info.contact is not provided', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: mockInfo },
    })

    const contact = wrapper.findComponent({ name: 'Contact' })
    expect(contact.exists()).toBe(false)
  })

  it('renders License when info.license is provided', () => {
    const wrapper = mount(InfoLinks, {
      props: {
        info: { ...mockInfo, license: mockLicense },
      },
    })

    const license = wrapper.findComponent({ name: 'License' })
    expect(license.exists()).toBe(true)
    expect(license.props('value')).toEqual(mockLicense)
  })

  it('does not render License when info.license is not provided', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: mockInfo },
    })

    const license = wrapper.findComponent({ name: 'License' })
    expect(license.exists()).toBe(false)
  })

  it('renders TermsOfService when info.termsOfService is provided', () => {
    const wrapper = mount(InfoLinks, {
      props: {
        info: { ...mockInfo, termsOfService: mockTermsOfService },
      },
    })

    const termsOfService = wrapper.findComponent({ name: 'TermsOfService' })
    expect(termsOfService.exists()).toBe(true)
    expect(termsOfService.props('value')).toEqual(mockTermsOfService)
  })

  it('does not render TermsOfService when info.termsOfService is not provided', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: mockInfo },
    })

    const termsOfService = wrapper.findComponent({ name: 'TermsOfService' })
    expect(termsOfService.exists()).toBe(false)
  })

  it('renders an InfoLink for each x-scalar-links entry', () => {
    const wrapper = mount(InfoLinks, {
      props: {
        info: {
          ...mockInfo,
          'x-scalar-links': [
            { name: 'Privacy Policy', url: 'https://example.com/privacy' },
            { name: 'Imprint', url: 'https://example.com/imprint' },
          ],
        },
      },
    })

    const infoLinks = wrapper.findAllComponents({ name: 'InfoLink' })
    expect(infoLinks).toHaveLength(2)
    expect(infoLinks[0]?.props()).toEqual({
      name: 'Privacy Policy',
      url: 'https://example.com/privacy',
    })
    expect(infoLinks[1]?.props()).toEqual({
      name: 'Imprint',
      url: 'https://example.com/imprint',
    })
  })

  it('renders LinkList when only x-scalar-links is provided', () => {
    const wrapper = mount(InfoLinks, {
      props: {
        info: {
          ...mockInfo,
          'x-scalar-links': [{ name: 'Imprint', url: 'https://example.com/imprint' }],
        },
      },
    })

    expect(wrapper.findComponent({ name: 'LinkList' }).exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'InfoLink' })).toHaveLength(1)
  })

  it('does not render any InfoLink when x-scalar-links is absent', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: { ...mockInfo, termsOfService: mockTermsOfService } },
    })

    expect(wrapper.findAllComponents({ name: 'InfoLink' })).toHaveLength(0)
  })

  it('renders all components when all info properties are provided', () => {
    const fullInfo = {
      ...mockInfo,
      contact: mockContact,
      license: mockLicense,
      termsOfService: mockTermsOfService,
    }

    const wrapper = mount(InfoLinks, {
      props: {
        info: fullInfo,
        externalDocs: mockExternalDocs,
      },
    })

    expect(wrapper.findComponent({ name: 'LinkList' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ExternalDocs' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Contact' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'License' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'TermsOfService' }).exists()).toBe(true)
  })

  it('renders only the provided link when minimal info has a single link', () => {
    const wrapper = mount(InfoLinks, {
      props: {
        info: { title: 'Minimal API', version: '1.0.0' },
        externalDocs: mockExternalDocs,
      },
    })

    expect(wrapper.findComponent({ name: 'LinkList' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ExternalDocs' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Contact' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'License' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'TermsOfService' }).exists()).toBe(false)
  })

  it('passes correct props to child components', () => {
    const fullInfo = {
      ...mockInfo,
      contact: mockContact,
      license: mockLicense,
      termsOfService: mockTermsOfService,
    }

    const wrapper = mount(InfoLinks, {
      props: {
        info: fullInfo,
        externalDocs: mockExternalDocs,
      },
    })

    // Check that each component receives the correct value prop
    expect(wrapper.findComponent({ name: 'ExternalDocs' }).props('value')).toEqual(mockExternalDocs)
    expect(wrapper.findComponent({ name: 'Contact' }).props('value')).toEqual(mockContact)
    expect(wrapper.findComponent({ name: 'License' }).props('value')).toEqual(mockLicense)
    expect(wrapper.findComponent({ name: 'TermsOfService' }).props('value')).toEqual(mockTermsOfService)
  })
})
