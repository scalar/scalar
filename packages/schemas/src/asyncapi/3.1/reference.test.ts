import { coerce, literal, object, optional, string, union } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { recursiveRef } from './reference'

/** A tiny stand-in for a discriminated object whose first `type` literal is a poor default. */
const securityLikeSchema = object({
  type: union([literal('userPassword'), literal('http'), literal('oauth2')]),
  scheme: optional(string()),
})

describe('recursiveRef', () => {
  it('coerces an inline object against the wrapped schema', () => {
    const schema = recursiveRef(securityLikeSchema)

    expect(coerce(schema, { type: 'http', scheme: 'bearer' })).toEqual({ type: 'http', scheme: 'bearer' })
  })

  it('does not synthesize a `$ref-value` for an unresolved reference', () => {
    const schema = recursiveRef(securityLikeSchema)

    // An unresolved `{ $ref }` must pass through untouched. If `$ref-value` were required, coercion
    // would fill it with a default instance of the wrapped schema (here `{ type: 'userPassword' }`),
    // which then leaks back over the referenced definition through the resolved-document proxy.
    const result = coerce(schema, { $ref: '#/components/securitySchemes/bearerAuth' })

    expect(result).toEqual({ $ref: '#/components/securitySchemes/bearerAuth' })
    expect(result).not.toHaveProperty('$ref-value')
  })

  it('coerces a `$ref-value` when one is already resolved', () => {
    const schema = recursiveRef(securityLikeSchema)

    const result = coerce(schema, {
      $ref: '#/components/securitySchemes/bearerAuth',
      '$ref-value': { type: 'http', scheme: 'bearer' },
    })

    expect(result).toMatchObject({
      $ref: '#/components/securitySchemes/bearerAuth',
      '$ref-value': { type: 'http', scheme: 'bearer' },
    })
  })

  it('stops at a `$ref-value` chain that loops back on itself', () => {
    const schema = recursiveRef(securityLikeSchema)
    const a: Record<string, unknown> = { $ref: '#/components/securitySchemes/b' }
    const b: Record<string, unknown> = { $ref: '#/components/securitySchemes/a' }
    a['$ref-value'] = b
    b['$ref-value'] = a

    expect(() => coerce(schema, a)).not.toThrow()
    expect(coerce(schema, a)).toMatchObject({ $ref: '#/components/securitySchemes/b' })
  })
})
