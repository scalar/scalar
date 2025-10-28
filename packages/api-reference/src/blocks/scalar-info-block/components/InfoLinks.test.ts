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

  it('renders LinkList wrapper', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: mockInfo },
    })

    expect(wrapper.findComponent({ name: 'LinkList' }).exists()).toBe(true)
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

  it('renders ExternalDocs without externalDocs prop', () => {
    const wrapper = mount(InfoLinks, {
      props: { info: mockInfo },
    })

    const externalDocs = wrapper.findComponent({ name: 'ExternalDocs' })
    expect(externalDocs.exists()).toBe(true)
    expect(externalDocs.props('value')).toBeUndefined()
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

  it('renders only required components when minimal info is provided', () => {
    const minimalInfo = {
      title: 'Minimal API',
      version: '1.0.0',
    }

    const wrapper = mount(InfoLinks, {
      props: { info: minimalInfo },
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
