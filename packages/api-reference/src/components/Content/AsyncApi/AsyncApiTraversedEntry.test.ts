import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { traverseAsyncApiDocument } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
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
  it.each(['modern', 'classic'] as const)(
    'renders documentation across an AsyncAPI document in %s layout',
    async (layout) => {
      const store = createWorkspaceStore()
      await store.addDocument({
        name: 'events',
        document: {
          asyncapi: '3.1.0',
          info: { title: 'Events', version: '1' },
          channels: {
            events: {
              address: 'events',
              externalDocs: { $ref: '#/components/externalDocs/channel' },
              tags: [{ $ref: '#/components/tags/events' }],
              messages: { notice: { $ref: '#/components/messages/notice' } },
            },
          },
          operations: {
            receive: {
              action: 'receive',
              channel: { $ref: '#/channels/events' },
              externalDocs: { $ref: '#/components/externalDocs/operation' },
              traits: [{ $ref: '#/components/operationTraits/documentation' }],
            },
          },
          components: {
            operationTraits: {
              documentation: { tags: [{ $ref: '#/components/tags/operation' }] },
            },
            externalDocs: {
              channel: { $ref: '#/components/externalDocs/guide' },
              guide: { url: 'https://example.com/channel', description: '**Channel** guide' },
              operation: { url: 'https://example.com/operation' },
              message: { url: 'https://example.com/message' },
              tag: { url: 'https://example.com/channel-tag' },
            },
            tags: {
              events: { name: 'Events', externalDocs: { $ref: '#/components/externalDocs/tag' } },
              operation: {
                name: 'Operation tag',
                externalDocs: { url: 'https://example.com/operation-tag', description: '*Trait tag* guide' },
              },
            },
            messages: {
              notice: {
                externalDocs: { $ref: '#/components/externalDocs/message' },
                tags: [{ name: 'Message tag', externalDocs: { url: 'https://example.com/message-tag' } }],
              },
            },
            schemas: { Notice: { type: 'object', externalDocs: { url: 'https://example.com/model' } } },
          },
        },
      })
      const document = store.workspace.documents.events
      if (!isAsyncApiDocument(document)) throw new Error('Expected an AsyncAPI document')
      const navigation = traverseAsyncApiDocument('events', document)
      const expandedItems: Record<string, boolean> = {}
      const expand = (entries: TraversedEntry[]): void => {
        for (const entry of entries) {
          expandedItems[entry.id] = true
          if ('children' in entry && entry.children) expand(entry.children)
        }
      }
      expand(navigation.children ?? [])
      const wrapper = mount(AsyncApiTraversedEntry, {
        props: {
          document,
          entries: navigation.children ?? [],
          expandedItems,
          eventBus: createWorkspaceEventBus(),
          options: {
            layout,
            hideModels: false,
            expandAllSchemaProperties: true,
            schemaKeyboardNav: false,
            orderSchemaPropertiesBy: 'preserve',
            orderRequiredPropertiesFirst: true,
          },
        },
      })
      const urls = wrapper
        .findAll('a')
        .map((link) => link.attributes('href'))
        .filter((url) => url?.startsWith('https://example.com/'))
      expect(urls.sort()).toStrictEqual([
        'https://example.com/channel',
        'https://example.com/channel-tag',
        'https://example.com/message',
        'https://example.com/message-tag',
        'https://example.com/model',
        'https://example.com/operation',
        'https://example.com/operation-tag',
      ])
      expect(wrapper.get('strong').text()).toBe('Channel')
      expect(wrapper.get('em').text()).toBe('Trait tag')
    },
  )

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
