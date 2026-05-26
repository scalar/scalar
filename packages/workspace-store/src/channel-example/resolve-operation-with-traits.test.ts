import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { resolveOperationWithTraits } from '@/channel-example/resolve-operation-with-traits'
import { getResolvedRef } from '@/helpers/get-resolved-ref'

describe('resolveOperationWithTraits', () => {
  it('uses operation security instead of trait security when both are defined', () => {
    const operation = {
      action: 'send',
      security: [
        {
          type: 'http',
          scheme: 'bearer',
        },
      ],
      traits: [
        {
          security: [
            {
              type: 'apiKey',
              in: 'user',
              name: 'trait-key',
            },
          ],
        },
      ],
    } as unknown as AsyncApiOperationObject

    const resolved = resolveOperationWithTraits(operation)

    expect(resolved.security).toStrictEqual([
      {
        type: 'http',
        scheme: 'bearer',
      },
    ])
  })

  it('keeps empty operation security to clear trait security', () => {
    const operation = {
      action: 'receive',
      security: [],
      traits: [
        {
          security: [
            {
              type: 'http',
              scheme: 'bearer',
            },
          ],
        },
      ],
    } as unknown as AsyncApiOperationObject

    const resolved = resolveOperationWithTraits(operation)

    expect(resolved.security).toStrictEqual([])
  })

  it('inherits trait security when operation security is not defined', () => {
    const operation = {
      action: 'receive',
      traits: [
        {
          security: [
            {
              type: 'http',
              scheme: 'bearer',
            },
          ],
        },
      ],
    } as AsyncApiOperationObject

    const resolved = resolveOperationWithTraits(operation)

    expect(resolved.security).toStrictEqual([
      {
        type: 'http',
        scheme: 'bearer',
      },
    ])
  })

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
