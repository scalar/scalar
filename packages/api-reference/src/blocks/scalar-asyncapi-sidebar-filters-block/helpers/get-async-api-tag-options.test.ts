import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import { getAsyncApiTagOptions } from './get-async-api-tag-options'

describe('get-async-api-tag-options', () => {
  it('offers no tag filter options for application-only tags', () => {
    const document = {
      asyncapi: '3.1.0',
      'x-scalar-original-document-hash': 'application-tags',
      info: { title: 'Events', version: '1', tags: [{ name: 'Application' }] },
    } satisfies AsyncApiDocument
    expect(getAsyncApiTagOptions(document, [])).toStrictEqual([{ id: '', label: 'All tags' }])
  })

  it('indexes visible owners and inherited tags without application-only tags or duplicate names', () => {
    const document = {
      asyncapi: '3.1.0',
      'x-scalar-original-document-hash': 'tag-options',
      info: { title: 'Events', version: '1', tags: [{ name: 'Application' }, { name: 'Events' }] },
      servers: { production: { host: 'example.com', protocol: 'wss', tags: [{ name: 'Production' }] } },
      channels: {
        events: {
          tags: [{ name: 'Events' }],
          messages: {
            audit: { traits: [{ tags: [{ name: 'Audit' }] }] },
            hidden: { tags: [{ name: 'Hidden' }] },
          },
        },
      },
      operations: {
        publish: { action: 'send', channel: { $ref: '#/channels/events' }, traits: [{ tags: [{ name: 'Events' }] }] },
        hidden: { action: 'send', channel: { $ref: '#/channels/events' }, tags: [{ name: 'Hidden' }] },
      },
    } satisfies AsyncApiDocument
    const entries = [
      {
        type: 'asyncapi-channel',
        id: 'events',
        title: 'Events',
        channelName: 'events',
        channelAddress: 'events',
        children: [
          {
            type: 'asyncapi-operation',
            id: 'publish',
            title: 'Publish',
            operationName: 'publish',
            action: 'send',
            channelName: 'events',
            channelAddress: 'events',
            children: [
              { type: 'asyncapi-message', id: 'audit', title: 'Audit', channelName: 'events', messageName: 'audit' },
            ],
          },
        ],
      },
    ] satisfies TraversedEntry[]
    expect(getAsyncApiTagOptions(document, entries)).toStrictEqual([
      { id: '', label: 'All tags' },
      { id: 'Audit', label: 'Audit' },
      { id: 'Events', label: 'Events' },
      { id: 'Production', label: 'Production' },
    ])
  })
})
