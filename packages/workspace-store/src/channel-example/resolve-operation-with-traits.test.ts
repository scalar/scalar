import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { resolveOperationWithTraits } from '@/channel-example/resolve-operation-with-traits'
import { getResolvedRef } from '@/helpers/get-resolved-ref'

describe('resolve-operation-with-traits', () => {
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

  it('uses later trait security instead of combining trait security arrays', () => {
    const operation = {
      action: 'receive',
      traits: [
        {
          security: [
            {
              type: 'apiKey',
              in: 'user',
              name: 'first-key',
            },
          ],
        },
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

  it('keeps empty later trait security to clear earlier trait security', () => {
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
        {
          security: [],
        },
      ],
    } as AsyncApiOperationObject

    const resolved = resolveOperationWithTraits(operation)

    expect(resolved.security).toStrictEqual([])
  })

  it('merges nested bindings with operation fields taking precedence', () => {
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
      // Partial fixture: the inline `query` schema widens `type` to `string`, which no longer
      // matches the strict Schema Object, so go through `unknown` like the other fixtures here.
    } as unknown as AsyncApiOperationObject

    const resolved = resolveOperationWithTraits(operation)

    expect(getResolvedRef(resolved.bindings)?.ws).toStrictEqual({
      method: 'POST',
      query: {
        type: 'object',
        properties: {
          fromTrait: { type: 'string' },
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

  it('inherits all metadata and a referenced reply without mutating the operation', () => {
    const reply = {
      channel: { $ref: '#/channels/replies', '$ref-value': { address: 'replies' } },
      messages: [{ $ref: '#/channels/replies/messages/result' }],
    }
    const trait = {
      title: 'Send event',
      summary: 'Shared summary',
      description: 'Shared description',
      tags: [{ name: 'events' }],
      externalDocs: { url: 'https://example.com/docs' },
      reply: { $ref: '#/components/replies/result', '$ref-value': reply },
    }
    const operation = {
      action: 'send',
      channel: { $ref: '#/channels/events' },
      traits: [{ $ref: '#/components/operationTraits/common', '$ref-value': trait }],
    } satisfies AsyncApiOperationObject
    const original = structuredClone(operation)

    expect(resolveOperationWithTraits(operation)).toStrictEqual({ ...operation, ...trait, reply })
    expect(operation).toStrictEqual(original)
  })

  it('applies traits in order and keeps explicit operation values including empty arrays', () => {
    const operation = {
      action: 'send',
      channel: { $ref: '#/channels/events' },
      title: 'Own title',
      description: '',
      tags: [],
      traits: [
        { title: 'First', summary: 'First summary', description: 'First description', tags: [{ name: 'first' }] },
        { title: 'Last', summary: 'Last summary', description: 'Last description', tags: [{ name: 'last' }] },
      ],
    } satisfies AsyncApiOperationObject

    expect(resolveOperationWithTraits(operation)).toStrictEqual({ ...operation, summary: 'Last summary' })
  })

  it('replaces trait tag arrays instead of concatenating them', () => {
    const operation = {
      action: 'send',
      channel: { $ref: '#/channels/events' },
      traits: [{ tags: [{ name: 'first' }] }, { tags: [{ name: 'last' }] }],
    } satisfies AsyncApiOperationObject

    expect(resolveOperationWithTraits(operation).tags).toStrictEqual([{ name: 'last' }])
  })

  it('merges external documentation and replies while preserving reply channel references', () => {
    const operation = {
      action: 'send',
      channel: { $ref: '#/channels/events' },
      externalDocs: { url: 'https://example.com/own' },
      reply: { channel: { $ref: '#/channels/ownReplies' }, messages: [] },
      traits: [
        {
          externalDocs: { url: 'https://example.com/trait', description: 'Shared docs' },
          reply: {
            address: { location: '$message.header#/replyTo' },
            channel: { $ref: '#/channels/replies', '$ref-value': { address: 'replies' } },
            messages: [{ $ref: '#/channels/replies/messages/result' }],
          },
        },
      ],
    } satisfies AsyncApiOperationObject

    const resolved = resolveOperationWithTraits(operation)
    expect(resolved.externalDocs).toStrictEqual({ url: 'https://example.com/own', description: 'Shared docs' })
    expect(resolved.reply).toStrictEqual({
      address: { location: '$message.header#/replyTo' },
      channel: { $ref: '#/channels/ownReplies' },
      messages: [],
    })
  })

  it('removes null binding keys and skips unresolved traits', () => {
    const operation = {
      action: 'send',
      channel: { $ref: '#/channels/events' },
      traits: [
        { bindings: { amqp: { ack: true, bindingVersion: '0.3.0' } } },
        { $ref: '#/components/operationTraits/missing' },
        { bindings: { amqp: { ack: null } } },
      ],
    } satisfies AsyncApiOperationObject

    expect(resolveOperationWithTraits(operation).bindings).toStrictEqual({ amqp: { bindingVersion: '0.3.0' } })
  })

  it('preserves identity without traits', () => {
    const operation = { action: 'send', channel: { $ref: '#/channels/events' } } satisfies AsyncApiOperationObject
    expect(resolveOperationWithTraits(operation)).toBe(operation)
  })
})
