import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { provideLocalization } from '@/features/localization'

import OperationTags from './OperationTags.vue'

const document: OpenApiDocument = {
  openapi: '3.2.1',
  info: { title: 'Tags', version: '1.0' },
  'x-scalar-original-document-hash': '',
  tags: [
    { name: 'Users', kind: 'nav' },
    { name: 'Beta', kind: 'badge', summary: 'Preview' },
    { name: 'Partners', kind: 'audience', summary: 'Partner API', 'x-displayName': 'Partners only' },
    { name: 'Hidden', kind: 'badge', 'x-internal': true },
    { name: 'Ignored', kind: 'audience', 'x-scalar-ignore': true },
  ],
}

describe('OperationTags', () => {
  it('renders label categories using display names and leaves navigation tags out', () => {
    const wrapper = mount(OperationTags, {
      props: { document, tags: ['Users', 'Beta', 'Partners', 'Beta', 'Missing', 'Hidden', 'Ignored'] },
    })
    expect(wrapper.text().replace(/\s+/g, ' ')).toBe('PreviewAudience: Partners only')
  })

  it('leaves earlier OpenAPI documents unchanged', () => {
    const wrapper = mount(OperationTags, {
      props: { document: { ...document, openapi: '3.1.2' }, tags: ['Beta', 'Partners'] },
    })
    expect(wrapper.text()).toBe('')
  })

  it('handles missing metadata', () => {
    expect(mount(OperationTags, { props: { tags: ['Beta'] } }).text()).toBe('')
    expect(mount(OperationTags, { props: { document } }).text()).toBe('')
  })

  it('localizes the audience label', () => {
    const wrapper = mount(
      defineComponent({
        setup: () => {
          provideLocalization({ locale: 'de' })
          return () => h(OperationTags, { document, tags: ['Partners'] })
        },
      }),
    )
    expect(wrapper.text()).toBe('Zielgruppe: Partners only')
  })
})
