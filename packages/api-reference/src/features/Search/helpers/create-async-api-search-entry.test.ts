import type { AsyncApiDocument, AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { traverseAsyncApiDocument } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'

import { filterAsyncApiNavigation } from '@/blocks/scalar-asyncapi-sidebar-filters-block/helpers/filter-async-api-navigation'
import { useSearchIndex } from '@/features/Search/hooks/useSearchIndex'

import { createAsyncApiSearchEntry } from './create-async-api-search-entry'
import { createSearchIndex } from './create-search-index'

const createDocument = (message: AsyncApiMessageObject & { 'x-internal'?: boolean } = {}): AsyncApiDocument => {
  const document: AsyncApiDocument = {
    asyncapi: '3.1.0',
    info: { title: 'Events', version: '1' },
    'x-scalar-original-document-hash': '',
    channels: {
      accountEvents: {
        address: 'accounts.{tenantId}',
        title: 'Account events',
        summary: 'Lifecycle notifications',
        description: 'Changes for an account',
        parameters: {
          tenantId: { $ref: '#/components/parameters/Tenant', '$ref-value': { description: 'Tenant discriminator' } },
        },
        messages: {
          accountCreated: {
            title: 'Account created',
            name: 'account.created.v1',
            summary: 'Signup notification',
            description: 'A new account exists',
            ...message,
          },
        },
      },
    },
    operations: {
      publishAccount: {
        action: 'send',
        channel: { $ref: '#/channels/accountEvents' },
        title: 'Publish account',
        traits: [{ description: 'Emits lifecycle changes' }],
      },
      consumeAccount: { action: 'receive', channel: { $ref: '#/channels/accountEvents' }, title: 'Consume account' },
    },
  }
  document['x-scalar-navigation'] = traverseAsyncApiDocument('events', document)
  return document
}

const search = (document: AsyncApiDocument, term: string): string[] => {
  const { query, results } = useSearchIndex(document)
  query.value = term
  return results.value.map(({ item }) => item.title)
}

describe('create-async-api-search-entry', () => {
  it('finds channels, parameters, operations, messages and inherited descriptions', () => {
    const document = createDocument()
    for (const [term, title] of [
      ['accountEvents', 'Account events'],
      ['tenantId', 'Account events'],
      ['Tenant discriminator', 'Account events'],
      ['Lifecycle notifications', 'Account events'],
      ['Changes for an account', 'Account events'],
      ['publishAccount', 'Publish account'],
      ['Emits lifecycle changes', 'Publish account'],
      ['account.created.v1', 'Account created'],
      ['Signup notification', 'Account created'],
      ['A new account exists', 'Account created'],
    ]) {
      expect(search(document, term ?? '')[0], term).toBe(title)
    }
    expect(
      createSearchIndex(document)
        .filter((entry) => entry.type === 'asyncapi-operation')
        .map(({ action }) => action)
        .sort(),
    ).toStrictEqual(['receive', 'send'])
  })

  it('uses one channel catalog anchor even when two operations reference the message', () => {
    const document = createDocument()
    const channel = traverseAsyncApiDocument('events', document).children?.find(
      (entry) => entry.type === 'asyncapi-channel',
    )
    const catalog =
      channel && 'children' in channel
        ? channel.children?.find((entry: TraversedEntry) => entry.type === 'asyncapi-message')
        : undefined
    const messages = createSearchIndex(document).filter((entry) => entry.type === 'asyncapi-message')
    expect(messages.map(({ id }) => id)).toStrictEqual([catalog?.id])
    expect(messages.map(({ identifiers }) => identifiers)).toStrictEqual([['accountCreated', 'account.created.v1']])
  })

  it('indexes nested array and composed fields, references, and trait headers without indexing literal data', () => {
    const document = createDocument({
      traits: [
        {
          headers: { type: 'object', properties: { correlationId: { type: 'string', description: 'Trace identity' } } },
        },
      ],
      payload: {
        schemaFormat: 'application/schema+json;version=draft-07',
        schema: {
          type: 'object',
          properties: {
            records: {
              type: 'array',
              items: {
                allOf: [
                  {
                    type: 'object',
                    properties: {
                      customer: {
                        type: 'object',
                        properties: {
                          emailAddress: {
                            $ref: '#/components/schemas/Email',
                            '$ref-value': { type: 'string', description: 'Delivery destination' },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
          examples: [{ properties: { literalOnly: { description: 'Not a schema' } } }],
        },
      },
    })
    for (const term of ['emailAddress', 'Delivery destination', 'correlationId', 'Trace identity']) {
      expect(search(document, term)).toStrictEqual(['Account created'])
    }
    expect(search(document, 'literalOnly')).toStrictEqual([])
  })

  it('terminates recursive schemas and retains names with unresolved or boolean schemas', () => {
    const schema: { type: 'object'; properties: Record<string, unknown> } = { type: 'object', properties: {} }
    schema.properties = {
      child: { $ref: '#/recursive', '$ref-value': schema },
      flag: true,
      missing: { $ref: '#/missing' },
    }
    const document = createDocument({ payload: schema as AsyncApiMessageObject['payload'] })
    expect(createSearchIndex(document).find((entry) => entry.type === 'asyncapi-message')?.body).toStrictEqual([
      'child',
      'flag',
      'missing',
    ])
  })

  it.each([
    true,
    false,
    { schemaFormat: 'application/vnd.apache.avro+json', schema: { properties: { misleadingField: {} } } },
  ])('skips fields in unsupported or boolean schemas: %j', (payload) => {
    const document = createDocument({ payload })
    expect(createSearchIndex(document).find((entry) => entry.type === 'asyncapi-message')?.body).toStrictEqual([])
  })

  it('keeps channel-only messages searchable and omits hidden content', () => {
    const document = createDocument()
    delete document.operations
    document['x-scalar-navigation'] = traverseAsyncApiDocument('events', document)
    expect(search(document, 'account.created.v1')).toStrictEqual(['Account created'])
    const hidden = createDocument({ 'x-internal': true })
    expect(createSearchIndex(hidden).filter((entry) => entry.type === 'asyncapi-message')).toStrictEqual([])
  })

  it('updates fields after nested document edits and replacement', () => {
    const document = reactive(
      createDocument({ payload: { type: 'object', properties: { oldField: { type: 'string' } } } }),
    )
    const { query, results } = useSearchIndex(() => document)
    query.value = 'oldField'
    expect(results.value.map(({ item }) => item.title)).toStrictEqual(['Account created'])
    const channel = document.channels?.accountEvents
    if (channel && 'messages' in channel && channel.messages?.accountCreated) {
      const message = getResolvedRef(channel.messages.accountCreated)
      if (!message) {
        throw new Error('Expected resolved message')
      }
      message.payload = { type: 'object', properties: { newField: { type: 'string' } } }
    }
    query.value = 'newField'
    expect(results.value.map(({ item }) => item.title)).toStrictEqual(['Account created'])
    query.value = 'oldField'
    expect(results.value.map(({ item }) => item.title)).toStrictEqual([])
  })

  it('respects the supplied filtered navigation tree', () => {
    const document = createDocument()
    document.servers = { broker: { host: 'broker.example', protocol: 'mqtt' } }
    const navigation = document['x-scalar-navigation']
    if (navigation) {
      navigation.children = filterAsyncApiNavigation(navigation.children, document, {
        protocol: 'kafka',
        server: undefined,
      })
    }
    expect(createSearchIndex(document).filter((entry) => entry.type.startsWith('asyncapi-'))).toStrictEqual([])
  })

  it('ignores non-AsyncAPI navigation entries', () => {
    expect(
      createAsyncApiSearchEntry(createDocument(), { type: 'text', id: 'intro', title: 'Introduction' }),
    ).toBeUndefined()
  })
})
