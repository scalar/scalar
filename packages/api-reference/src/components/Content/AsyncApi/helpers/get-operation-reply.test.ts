import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { traverseAsyncApiDocument } from '@scalar/workspace-store/navigation'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { describe, expect, it } from 'vitest'

import { getOperationReply } from './get-operation-reply'

const createDocument = (
  reply: Exclude<NonNullable<AsyncApiOperationObject['reply']>, { $ref: string }> = {
    channel: { $ref: '#/channels/replies' },
    messages: [{ $ref: '#/channels/replies/messages/result' }],
  },
): AsyncApiDocument => {
  const document: AsyncApiDocument = {
    asyncapi: '3.1.0',
    info: { title: 'Request reply', version: '1' },
    'x-scalar-original-document-hash': '',
    channels: {
      requests: { address: 'requests' },
      replies: {
        address: 'replies',
        title: 'Reply channel',
        messages: {
          result: { title: 'Result', payload: { type: 'string' } },
          other: { title: 'Other result' },
        },
      },
    },
    operations: {
      request: { action: 'send', channel: { $ref: '#/channels/requests' }, reply },
    },
  }
  document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)
  return document
}

const readReply = (document: AsyncApiDocument): ReturnType<typeof getOperationReply> =>
  getOperationReply(document, getResolvedRef(document.operations?.request))

describe('get-operation-reply', () => {
  it('links the declared reply subset to channel-only message schemas', () => {
    expect(readReply(createDocument())).toStrictEqual({
      channel: { title: 'Reply channel', id: 'test/channel/replies' },
      address: 'replies',
      dynamicAddress: false,
      description: undefined,
      messages: [{ title: 'Result', id: 'test/channel/replies/message/result' }],
    })
  })

  it('finds the rendered message beneath another operation', () => {
    const document = createDocument()
    document.operations = {
      ...document.operations,
      response: { action: 'receive', channel: { $ref: '#/channels/replies' } },
    }
    document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)
    expect(readReply(document)?.messages).toStrictEqual([
      { title: 'Result', id: 'test/channel/replies/operation/response/message/result' },
    ])
  })

  it('resolves referenced replies and dynamic addresses through the document loader', async () => {
    const source = createDocument()
    source.components = {
      replies: {
        response: {
          channel: { $ref: '#/channels/replies' },
          address: { $ref: '#/components/replyAddresses/inbox' },
          messages: [{ $ref: '#/channels/replies/messages/result' }],
        },
      },
      replyAddresses: { inbox: { location: '$message.header#/replyTo', description: 'Sender inbox' } },
    }
    source.channels = {
      ...source.channels,
      replies: { address: null, title: 'Reply channel', messages: { result: { title: 'Result' } } },
    }
    source.operations = {
      request: {
        action: 'send',
        channel: { $ref: '#/channels/requests' },
        reply: { $ref: '#/components/replies/response' },
      },
    }
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'test', document: source })
    const document = store.workspace.documents.test
    if (!isAsyncApiDocument(document)) {
      throw new Error('Expected AsyncAPI document')
    }
    expect(readReply(document)).toStrictEqual({
      channel: { title: 'Reply channel', id: 'test/channel/replies' },
      address: '$message.header#/replyTo',
      dynamicAddress: true,
      description: 'Sender inbox',
      messages: [{ title: 'Result', id: 'test/channel/replies/message/result' }],
    })
  })

  it('does not infer reply messages when the list is absent or empty', () => {
    for (const messages of [undefined, []]) {
      expect(readReply(createDocument({ channel: { $ref: '#/channels/replies' }, messages }))?.messages).toStrictEqual(
        [],
      )
    }
  })

  it('renders address-only replies without requiring a channel', () => {
    expect(readReply(createDocument({ address: { location: '$message.payload#/inbox' } }))).toStrictEqual({
      channel: undefined,
      address: '$message.payload#/inbox',
      dynamicAddress: true,
      description: undefined,
      messages: [],
    })
  })

  it('keeps unresolved targets as text instead of broken links', () => {
    expect(
      readReply(
        createDocument({
          channel: { $ref: '#/channels/missing' },
          messages: [{ $ref: '#/channels/missing/messages/result' }],
        }),
      ),
    ).toStrictEqual({
      channel: { title: 'missing', id: undefined },
      address: undefined,
      dynamicAddress: false,
      description: undefined,
      messages: [{ title: 'result', id: undefined }],
    })
  })

  it('omits hidden reply channels and messages', () => {
    const document = createDocument()
    document.channels = { ...document.channels, replies: { title: 'Private', ...{ 'x-internal': true } } }
    expect(readReply(document)).toBeUndefined()
    document.channels = {
      ...document.channels,
      replies: { messages: { result: { title: 'Hidden', ...{ 'x-scalar-ignore': true } } } },
    }
    expect(readReply(document)?.messages).toStrictEqual([])
  })

  it('decodes escaped channel and message names when choosing the rendered target', () => {
    const document = createDocument({
      channel: { $ref: '#/channels/replies~1v1' },
      messages: [{ $ref: '#/channels/replies~1v1/messages/result~0v1' }],
    })
    document.channels = {
      ...document.channels,
      'replies/v1': { messages: { 'result~v1': { title: 'Escaped result' } } },
    }
    document['x-scalar-navigation'] = traverseAsyncApiDocument('test', document)
    expect(readReply(document)?.messages).toStrictEqual([
      { title: 'Escaped result', id: 'test/channel/repliesv1/message/resultv1' },
    ])
  })

  it('omits the section for operations without replies or unresolved reply references', () => {
    expect(getOperationReply(createDocument(), undefined)).toBeUndefined()
    expect(
      getOperationReply(createDocument(), {
        action: 'send',
        channel: { $ref: '#/channels/requests' },
        reply: { $ref: '#/components/replies/missing' },
      }),
    ).toBeUndefined()
  })
})
