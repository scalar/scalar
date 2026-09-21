import { createExternalExampleResolver } from '@scalar/workspace-store/helpers/external-examples'
import { EXTERNAL_EXAMPLES } from '@scalar/workspace-store/helpers/use-external-examples'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ExampleResponses from './ExampleResponses.vue'

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

describe('ExampleResponses.external', () => {
  it('renders a fetched response example without downloading other responses', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const fetch = vi.fn(() => Promise.resolve(Response.json({ accepted: true })))
    const resolver = createExternalExampleResolver({ fetch })
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Accepted',
            content: {
              'application/json': {
                examples: {
                  accepted: { externalValue: 'https://example.com/accepted' },
                },
              },
            },
          },
          '400': {
            description: 'Rejected',
            content: {
              'application/json': {
                examples: {
                  rejected: { externalValue: 'https://example.com/rejected' },
                },
              },
            },
          },
        },
      },
      global: { provide: { [EXTERNAL_EXAMPLES]: () => resolver } },
    })
    await vi.waitFor(() => expect(wrapper.text()).toContain('"accepted": true'))
    expect(fetch.mock.calls.length).toBe(1)
    expect(wrapper.find('button[aria-label="Copy example value"]').exists()).toBe(true)
  })
  it('loads the first example of a newly selected content type', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const fetch = vi.fn((input: string | URL | Request) => Promise.resolve(Response.json({ source: String(input) })))
    const resolver = createExternalExampleResolver({ fetch })
    const wrapper = mount(ExampleResponses, {
      props: {
        responses: {
          '200': {
            description: 'Accepted',
            content: {
              'application/json': {
                examples: {
                  first: { externalValue: 'https://example.com/first' },
                  second: { externalValue: 'https://example.com/second' },
                },
              },
              'application/yaml': {
                examples: {
                  problem: { externalValue: 'https://example.com/problem' },
                  other: { externalValue: 'https://example.com/other' },
                },
              },
            },
          },
        },
      },
      global: { provide: { [EXTERNAL_EXAMPLES]: () => resolver } },
    })
    await vi.waitFor(() => expect(wrapper.text()).toContain('https://example.com/first'))
    await wrapper.setProps({ selectedContentTypes: { '200': 'application/yaml' } })
    await vi.waitFor(() => expect(wrapper.text()).toContain('https://example.com/problem'))
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      'https://example.com/first',
      'https://example.com/problem',
    ])
  })
})
