import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AsyncApiDocumentation from './AsyncApiDocumentation.vue'

describe('AsyncApiDocumentation', () => {
  it('renders owner documentation and documentation from referenced tags', () => {
    const owner: Pick<AsyncApiInfoObject, 'externalDocs' | 'tags'> = {
      externalDocs: { url: 'https://example.com/owner', description: '**Owner** guide' },
      tags: [
        {
          $ref: '#/components/tags/stream',
          '$ref-value': {
            name: 'Streams',
            externalDocs: {
              $ref: '#/components/externalDocs/tag',
              '$ref-value': {
                url: 'https://example.com/tag',
                description: '*Tag* guide',
              },
            },
          },
        },
      ],
    }
    const wrapper = mount(AsyncApiDocumentation, { props: { owner } })
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toStrictEqual([
      'https://example.com/owner',
      'https://example.com/tag',
    ])
    expect(wrapper.findAll('a').map((link) => link.text())).toStrictEqual(['**Owner** guide', '*Tag* guide'])
  })

  it('omits tags and documentation that have not resolved', () => {
    const wrapper = mount(AsyncApiDocumentation, {
      props: {
        owner: {
          externalDocs: { $ref: '#/missing' },
          tags: [{ $ref: '#/missing-tag' }, { name: 'Empty' }],
        },
      },
    })
    expect(wrapper.text()).toBe('')
    expect(wrapper.find('a').exists()).toBe(false)
  })
})
