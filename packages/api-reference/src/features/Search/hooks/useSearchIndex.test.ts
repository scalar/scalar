import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { traverseAsyncApiDocument } from '@scalar/workspace-store/navigation'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'

import { useSearchIndex } from './useSearchIndex'

describe('useSearchIndex', () => {
  it('initializes with empty search state and watches for items changes', () => {
    const { query, results } = useSearchIndex({
      'x-scalar-navigation': {
        children: [
          {
            type: 'operation',
            id: 'scalar-test/test-operation',
            title: 'Test Operation',
            method: 'get',
            path: '/test',
          },
        ],
      },
    } as any)

    // Initial state should be empty
    expect(query.value).toBe('')
    expect(results.value).toMatchObject([
      {
        item: {
          id: 'scalar-test/test-operation',
          method: 'get',
          path: '/test',
          title: 'Test Operation',
          type: 'operation',
        },
      },
    ])
  })
  it('reindexes AsyncAPI payload and header fields after in-place edits', () => {
    const payloadProperties = reactive<Record<string, { type: 'string'; description: string }>>({
      orbitalMass: { type: 'string', description: 'Original mass' },
    })
    const headerProperties = reactive<Record<string, { type: 'string'; description: string }>>({})
    const document = reactive({
      asyncapi: '3.1.0',
      info: { title: 'Events', version: '1.0' },
      channels: {
        events: {
          address: 'events',
          messages: {
            changed: {
              title: 'Changed',
              payload: { type: 'object', properties: payloadProperties },
              headers: { type: 'object', properties: headerProperties },
            },
          },
        },
      },
    }) as unknown as AsyncApiDocument
    document['x-scalar-navigation'] = traverseAsyncApiDocument('events', document)
    const { query, results } = useSearchIndex(document)
    query.value = 'beaconIdentifier'
    expect(results.value.map((result) => result.item.title)).toStrictEqual([])
    payloadProperties.beaconIdentifier = { type: 'string', description: 'New beacon field' }
    expect(results.value.map((result) => result.item.body)).toStrictEqual([['orbitalMass', 'beaconIdentifier']])
    delete payloadProperties.orbitalMass
    headerProperties.traceKey = { type: 'string', description: 'New trace header' }
    query.value = 'traceKey'
    expect(results.value.map((result) => result.item.body)).toStrictEqual([['beaconIdentifier', 'traceKey']])
    expect(results.value.map((result) => result.item.bodyDescriptions)).toStrictEqual([
      ['New beacon field', 'New trace header'],
    ])
  })
})
