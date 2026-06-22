import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AsyncApiTraversedEntry from './AsyncApiTraversedEntry.vue'

const document = {
  asyncapi: '3.0.0',
  info: { title: 'Streaming API', version: '1.0.0' },
  'x-scalar-original-document-hash': '',
  channels: {},
} as unknown as AsyncApiDocument

describe('AsyncApiTraversedEntry', () => {
  /**
   * Tag groups are rendered through the flatten branch in modern layout, so they
   * must not count toward the sibling-tag total. If they did, a lone regular tag
   * sitting next to a tag group would get `moreThanOneTag = true` and `ModernLayout`
   * would hide its body behind a "Show more" button while collapsed.
   */
  it('does not count sibling tag groups when computing moreThanOneTag', () => {
    const entries: TraversedEntry[] = [
      {
        id: 'tag',
        type: 'tag',
        title: 'Only Tag',
        name: 'only-tag',
        isGroup: false,
        children: [],
      },
      {
        id: 'group',
        type: 'tag',
        title: 'A Group',
        name: 'a-group',
        isGroup: true,
        children: [],
      },
    ]

    const wrapper = mount(AsyncApiTraversedEntry, {
      props: {
        entries,
        document,
        // `Lazy` only renders its slot when the entry is expanded; mark both
        // so the assertion can see the rendered `<Tag>` for the regular tag.
        expandedItems: { tag: true, group: true },
        options: {
          layout: 'modern',
          hideModels: false,
          expandAllSchemaProperties: false,
          orderSchemaPropertiesBy: 'preserve',
          orderRequiredPropertiesFirst: true,
        },
        eventBus: null as never,
      },
    })

    const tagComponents = wrapper.findAllComponents({ name: 'Tag' })
    expect(tagComponents).toHaveLength(1)
    expect(tagComponents[0]?.props('moreThanOneTag')).toBe(false)
  })
})
