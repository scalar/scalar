import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'
import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { asyncApiOperationTraitObject } from './operation-trait'

describe('operation-trait', () => {
  it('preserves replies in operation traits', () => {
    const trait = {
      title: 'Request event',
      reply: {
        channel: { $ref: '#/channels/replies' },
        address: { location: '$message.header#/replyTo' },
        messages: [{ $ref: '#/channels/replies/messages/result' }],
      },
    } satisfies NonNullable<AsyncApiOperationObject['traits']>[number]

    expect(validate(asyncApiOperationTraitObject, trait)).toBe(true)
    expect(coerce(asyncApiOperationTraitObject, trait)).toStrictEqual(trait)
  })

  it('accepts referenced replies', () => {
    const trait = { reply: { $ref: '#/components/replies/result' } } satisfies NonNullable<
      AsyncApiOperationObject['traits']
    >[number]
    expect(coerce(asyncApiOperationTraitObject, trait)).toStrictEqual(trait)
  })
})
