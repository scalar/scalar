import { ScalarCopy } from '@scalar/components/copy'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
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
  it.each(['classic', 'modern'] as const)('renders source models and keeps their anchors in %s layout', (layout) => {
    const schema = 'message User { string id = 1; }'
    const wrapper = mount(AsyncApiTraversedEntry, {
      props: {
        entries: [{ type: 'model', id: 'model-user', ref: '#/components/schemas/User', name: 'User', title: 'User' }],
        document: {
          ...document,
          components: { schemas: { User: { schemaFormat: 'application/vnd.google.protobuf;version=3', schema } } },
        },
        expandedItems: { 'model-user': true },
        options: {
          layout,
          hideModels: false,
          expandAllSchemaProperties: false,
          schemaKeyboardNav: false,
          orderSchemaPropertiesBy: 'preserve',
          orderRequiredPropertiesFirst: true,
        },
        eventBus: createWorkspaceEventBus(),
      },
    })
    expect(wrapper.text()).toContain('User')
    expect(wrapper.text()).toContain('application/vnd.google.protobuf;version=3')
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(schema)
    expect(wrapper.find('[id="model-user"]').exists()).toBe(true)
  })

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
          schemaKeyboardNav: false,
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
