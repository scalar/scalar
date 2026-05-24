import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { resolveOperationWithTraits } from '@/channel-example/resolve-operation-with-traits'
import { getResolvedRef } from '@/helpers/get-resolved-ref'

describe('resolveOperationWithTraits', () => {
  it('lets operation WebSocket bindings override trait bindings on conflicts', () => {
    const operation = {
      action: 'send',
      bindings: {
        ws: {
          method: 'POST',
          query: {
            type: 'object',
            properties: {
              token: { type: 'string' },
            },
          },
        },
      },
      traits: [
        {
          bindings: {
            ws: {
              method: 'GET',
              query: {
                type: 'object',
                properties: {
                  fromTrait: { type: 'string' },
                },
              },
            },
          },
        },
      ],
    } as AsyncApiOperationObject

    const resolved = resolveOperationWithTraits(operation)

    expect(getResolvedRef(resolved.bindings)?.ws).toStrictEqual({
      method: 'POST',
      query: {
        type: 'object',
        properties: {
          token: { type: 'string' },
        },
      },
    })
  })

  it('merges trait bindings when the operation has none', () => {
    const operation = {
      action: 'receive',
      traits: [
        {
          bindings: {
            ws: {
              method: 'GET',
            },
          },
        },
      ],
    } as AsyncApiOperationObject

    const resolved = resolveOperationWithTraits(operation)

    expect(getResolvedRef(resolved.bindings)?.ws).toStrictEqual({
      method: 'GET',
    })
  })
})
