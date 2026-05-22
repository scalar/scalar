import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import type { IdGenerator } from '@/schemas/navigation'

import { traverseAsyncMessages } from './traverse-async-messages'

const generateId: IdGenerator = (props) =>
  props.type === 'message' || props.type === 'messages'
    ? `${props.parentId}/${props.type}/${'name' in props ? (props.name ?? '') : ''}`
    : 'unknown'

describe('traverseAsyncMessages', () => {
  it('returns an empty array when components.messages is absent', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      'x-scalar-original-document-hash': '',
    }

    expect(traverseAsyncMessages({ document, generateId, documentId: 'doc' })).toEqual([])
  })

  it('emits one entry per message with the expected ref and id', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      components: {
        messages: {
          PlanetCreated: { title: 'Planet Created Event' },
          PlanetDeleted: { name: 'PlanetDeleted' },
        },
      },
      'x-scalar-original-document-hash': '',
    }

    const entries = traverseAsyncMessages({ document, generateId, documentId: 'doc' })

    expect(entries).toEqual([
      {
        id: 'doc/message/PlanetCreated',
        title: 'Planet Created Event',
        name: 'PlanetCreated',
        ref: '#/components/messages/PlanetCreated',
        type: 'message',
      },
      {
        id: 'doc/message/PlanetDeleted',
        title: 'PlanetDeleted',
        name: 'PlanetDeleted',
        ref: '#/components/messages/PlanetDeleted',
        type: 'message',
      },
    ])
  })

  it('falls back to the entry name when title and message.name are missing', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      components: { messages: { LightOn: {} } },
      'x-scalar-original-document-hash': '',
    }

    const entries = traverseAsyncMessages({ document, generateId, documentId: 'doc' })

    expect(entries[0]?.title).toBe('LightOn')
  })
})
