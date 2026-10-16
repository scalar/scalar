import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AsyncApiTags from './AsyncApiTags.vue'

describe('AsyncApiTags', () => {
  it('renders referenced tag metadata and external documentation', () => {
    const wrapper = mount(AsyncApiTags, {
      props: {
        tags: [
          {
            $ref: '#/components/tags/audit',
            '$ref-value': {
              name: 'Audit',
              description: 'For **compliance**',
              externalDocs: {
                $ref: '#/components/externalDocs/audit',
                '$ref-value': { url: 'https://example.com/audit', description: 'Audit guide' },
              },
            },
          },
        ],
      },
    })
    expect(wrapper.get('summary').text()).toBe('Audit')
    expect(wrapper.get('strong').text()).toBe('compliance')
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com/audit')
    expect(wrapper.get('a').text()).toBe('Audit guide')
  })

  it('renders plain tags without disclosure controls', () => {
    const wrapper = mount(AsyncApiTags, { props: { tags: [{ name: 'Billing' }] } })
    expect(wrapper.text()).toBe('Billing')
    expect(wrapper.find('summary').exists()).toBe(false)
  })

  it('renders nothing for absent or unresolved tags', () => {
    const wrapper = mount(AsyncApiTags, { props: { tags: [{ $ref: '#/components/tags/missing' }] } })
    expect(wrapper.text()).toBe('')
  })
})
