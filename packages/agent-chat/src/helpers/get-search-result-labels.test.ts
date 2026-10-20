import { describe, expect, it } from 'vitest'

import { getSearchResultLabels } from './get-search-result-labels'

describe('get-search-result-labels', () => {
  it('keeps OpenAPI summaries and excludes path metadata', () => {
    expect(
      getSearchResultLabels({
        info: { title: 'Pets' },
        paths: {
          '/pets': {
            summary: 'Path',
            parameters: [],
            get: { summary: 'List pets' },
            post: {},
          },
        },
      }),
    ).toStrictEqual(['Pets - List pets', 'Pets - POST /pets'])
  })

  it('resolves AsyncAPI channel and message references', () => {
    expect(
      getSearchResultLabels({
        asyncapi: '3.1.0',
        info: { title: 'Events' },
        channels: {
          orders: { address: 'orders/created', messages: { created: { $ref: '#/components/messages/created' } } },
        },
        operations: { receiveOrder: { action: 'receive', channel: { $ref: '#/channels/orders' } } },
        components: { messages: { created: { title: 'Order created' } } },
      }),
    ).toStrictEqual([
      'Events - receive orders/created: receiveOrder',
      'Events - Channel orders/created: orders',
      'Events - Message Order created (orders/created)',
    ])
  })

  it('includes channels without operations and labels unknown addresses', () => {
    expect(getSearchResultLabels({ asyncapi: '3.1.0', channels: { orders: { address: null } } })).toStrictEqual([
      'Channel Unknown address: orders',
    ])
  })

  it('handles missing data and unresolved references', () => {
    expect(getSearchResultLabels(null)).toStrictEqual([])
    expect(getSearchResultLabels({ asyncapi: '3.1.0', channels: { missing: { $ref: '#/missing' } } })).toStrictEqual([])
  })
})
