import type { Heading } from '@scalar/types/legacy'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import IntroductionLayout from './IntroductionLayout.vue'

const mockProps = {
  id: '',
  headingSlugGenerator: (heading: Heading) => `document/${heading.slug}`,
  specificationVersion: undefined,
  getOriginalDocument: () => '{}',
  eventBus: null,
}

describe('IntroductionLayout', () => {
  it('renders the given information', () => {
    const example: OpenApiDocument = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World',
        description: 'Example description',
        version: '1.0.0',
        contact: {
          name: 'Marc from Scalar',
          email: 'marc@scalar.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/license/MIT',
        },
        termsOfService: 'https://scalar.com/terms',
      },
      externalDocs: {
        description: 'Documentation',
        url: 'https://scalar.com',
      },
      'x-scalar-original-document-hash': '',
    }

    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        info: example.info,
        externalDocs: example.externalDocs,
      },
    })

    expect(wrapper.html()).toContain('Hello World')
    expect(wrapper.html()).toContain('Example description')
    expect(wrapper.html()).toContain('v1.0.0')
    expect(wrapper.html()).toContain('Documentation')
    expect(wrapper.html()).toContain('Marc from Scalar')
    expect(wrapper.html()).toContain('MIT')
    expect(wrapper.html()).toContain('Terms of Service')
  })

  it('renders the loading skeleton while the document has no info yet', () => {
    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        info: undefined,
      },
    })

    // The skeleton mirrors the introduction layout instead of generic bars.
    expect(wrapper.find('.introduction-loading').exists()).toBe(true)
    expect(wrapper.find('.introduction-skeleton').exists()).toBe(true)
  })

  /**
   * We use the .introduction-section class for theming widely
   * so we need to make sure it's there
   */
  it('exposes the .introduction-section class for theming', () => {
    const example: OpenApiDocument = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World',
        description: 'Example description',
        version: '1.0.0',
      },
      'x-scalar-original-document-hash': '',
    }

    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        info: example.info,
        externalDocs: example.externalDocs,
      },
    })

    const section = wrapper.get('.introduction-section')

    expect(section.html()).toContain('Hello World')
  })

  it('shows version badge when version exists', () => {
    const example: OpenApiDocument = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: '2.0.0',
      },
      'x-scalar-original-document-hash': '',
    }

    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        info: example.info,
        externalDocs: example.externalDocs,
      },
    })

    expect(wrapper.html()).toContain('v2.0.0')
  })

  it(`doesn't prefix version with v when version is not a number`, () => {
    const example: OpenApiDocument = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: 'beta',
      },
      'x-scalar-original-document-hash': '',
    }

    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        info: example.info,
        externalDocs: example.externalDocs,
      },
    })

    expect(wrapper.html()).not.toContain('vbeta')
    expect(wrapper.html()).toContain('beta')
  })

  it(`doesn't prefix version with v when version is already prefixed`, () => {
    const example: OpenApiDocument = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: 'v1.0.0',
      },
      'x-scalar-original-document-hash': '',
    }

    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        info: example.info,
        externalDocs: example.externalDocs,
      },
    })

    expect(wrapper.html()).toContain('v1.0.0')
  })

  it('prefixes version with v when version is a number', () => {
    const example: OpenApiDocument = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        // @ts-expect-error testing invalid type
        version: 1,
      },
    }

    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        info: example.info,
        externalDocs: example.externalDocs,
      },
    })

    expect(wrapper.html()).toContain('v1')
  })

  it.each(['urn:example:events', 'https://example.com/events'])(
    'renders the application identifier %s separately from the title and versions',
    (applicationIdentifier) => {
      const wrapper = mount(IntroductionLayout, {
        props: {
          ...mockProps,
          id: 'events/introduction',
          documentType: 'asyncapi',
          applicationIdentifier,
          specificationVersion: '3.1.0',
          info: { title: 'Events API', version: '1.2.3' },
        },
      })

      expect(wrapper.get('dt').text()).toBe('Application identifier')
      expect(wrapper.get('dd').text()).toBe(applicationIdentifier)
      expect(wrapper.get('h1').text()).toBe('Events API')
      expect(wrapper.text()).toContain('v1.2.3')
      expect(wrapper.text()).toContain('AsyncAPI 3.1.0')
      expect(wrapper.get('section').attributes('id')).toBe('events/introduction')
      expect(wrapper.find('a').exists()).toBe(false)
    },
  )

  it.each([undefined, ''])('omits an absent application identifier (%s)', (applicationIdentifier) => {
    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        documentType: 'asyncapi',
        applicationIdentifier,
        info: { title: 'Events', version: '1.0.0' },
      },
    })
    expect(wrapper.text()).not.toContain('Application identifier')
  })

  it('omits the application identifier for OpenAPI documents', () => {
    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        documentType: 'openapi',
        applicationIdentifier: 'urn:example:events',
        info: { title: 'API', version: '1.0.0' },
      },
    })
    expect(wrapper.text()).not.toContain('Application identifier')
    expect(wrapper.text()).not.toContain('urn:example:events')
  })

  it('updates and removes the application identifier when the document changes', async () => {
    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        documentType: 'asyncapi',
        applicationIdentifier: 'urn:example:first',
        info: { title: 'Events', version: '1.0.0' },
      },
    })
    await wrapper.setProps({ applicationIdentifier: 'urn:example:second' })
    expect(wrapper.get('dd').text()).toBe('urn:example:second')
    expect(wrapper.text()).not.toContain('urn:example:first')
    await wrapper.setProps({ applicationIdentifier: undefined })
    expect(wrapper.text()).not.toContain('Application identifier')
  })
})
