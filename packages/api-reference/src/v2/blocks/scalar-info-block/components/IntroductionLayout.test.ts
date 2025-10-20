import type { Heading } from '@scalar/types'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import IntroductionLayout from './IntroductionLayout.vue'

const mockProps = {
  id: '',
  headingSlugGenerator: (heading: Heading) => `document/${heading.slug}`,
  oasVersion: undefined,
  getOriginalDocument: () => '{}',
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

  it('renders loading state when info is empty', () => {
    const example: OpenApiDocument = {
      openapi: '3.1.1',
      info: {
        title: '',
        description: '',
        version: '',
      },
    }

    const wrapper = mount(IntroductionLayout, {
      props: {
        ...mockProps,
        info: example.info,
        externalDocs: example.externalDocs,
      },
    })

    expect(wrapper.find('.loading').exists()).toBe(true)
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
})
