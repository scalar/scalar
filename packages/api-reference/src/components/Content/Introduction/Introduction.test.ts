import { DownloadLink } from '@/features/DownloadLink'
import type { Spec } from '@scalar/types/legacy'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Introduction from './Introduction.vue'

describe('Introduction', () => {
  it('renders the given information', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World',
        description: 'Example description',
        version: '1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: {
          title: 'Hello World',
          description: 'Example description',
          version: '1.0.0',
        },
      },
    })

    expect(wrapper.html()).toContain('Hello World')
    expect(wrapper.html()).toContain('Example description')
    expect(wrapper.html()).toContain('v1.0.0')
    expect(wrapper.html()).toContain('OAS 3.1.1')
  })

  it('renders loading state when info is empty', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: '',
        description: '',
        version: '',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: example.info,
      },
    })

    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  /**
   * We use the .introduction-section class for theming widely
   * so we need to make sure it's there
   */
  it('exposes the .introduction-section class for theming', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World',
        description: 'Example description',
        version: '1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: example.info,
      },
    })

    const section = wrapper.get('.introduction-section')

    expect(section.html()).toContain('Hello World')
    expect(section.html()).toContain('Example description')
    expect(section.html()).toContain('v1.0.0')
    expect(section.html()).toContain('OAS 3.1.1')
  })

  it('generates filename from title', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World API!',
        description: '',
        version: '1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: example.info,
      },
    })

    const downloadLink = wrapper.findComponent(DownloadLink)
    expect(downloadLink.props('specTitle')).toBe('hello-world-api')
  })

  it('shows version badge when version exists', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: '2.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: example.info,
      },
    })

    expect(wrapper.html()).toContain('v2.0.0')
  })

  it('doesn’t prefix version with v when version is not a number', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: 'beta',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: example.info,
      },
    })

    expect(wrapper.html()).not.toContain('vbeta')
    expect(wrapper.html()).toContain('beta')
  })

  it('doesn’t prefix version with v when version is already prefixed', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        version: 'v1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: example.info,
      },
    })

    expect(wrapper.html()).toContain('v1.0.0')
  })

  it('prefixes version with v when version is a number', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        // @ts-expect-error testing invalid type
        version: 1,
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        // @ts-expect-error testing invalid type
        parsedSpec: example,
        // @ts-expect-error testing invalid type
        info: example.info,
      },
    })

    expect(wrapper.html()).toContain('v1')
  })

  it('doesn’t output the version if something is wrong with the version', () => {
    const example = {
      openapi: '3.1.1',
      info: {
        title: 'Test API',
        description: '',
        // @ts-expect-error testing invalid type
        version: ['foobar'],
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        // @ts-expect-error testing invalid type
        parsedSpec: example,
        // @ts-expect-error testing invalid type
        info: example.info,
      },
    })

    expect(wrapper.html()).not.toContain('foobar')
  })

  it('shows OpenAPI version badge for OpenAPI spec', () => {
    const example = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        description: '',
        version: '1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: example.info,
      },
    })

    expect(wrapper.html()).toContain('OAS 3.0.0')
  })

  it('shows OpenAPI version badge for version 2.0', () => {
    const example = {
      swagger: '2.0',
      info: {
        title: 'Test API',
        description: '',
        version: '1.0.0',
      },
    } satisfies Spec

    const wrapper = mount(Introduction, {
      props: {
        parsedSpec: example,
        info: example.info,
      },
    })

    expect(wrapper.html()).toContain('OAS 2.0')
  })
})
