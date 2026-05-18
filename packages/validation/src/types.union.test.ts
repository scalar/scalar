import { describe, expect, it } from 'vitest'

import { coerce } from '@/coerce'
import { intersection, lazy, literal, object, union } from '@/schema'
import type { Static } from '@/types'

describe('types union static', () => {
  it('infers union of lazy intersection branches without hitting depth limit', () => {
    const doc = intersection([object({ type: literal('document') })])
    const desc = intersection([object({ type: literal('text') })])
    const entry = union([lazy(() => doc), lazy(() => desc)] as const)

    const result = coerce(entry, { type: 'document' })

    expect(result).toMatchObject({ type: 'document' })

    type Entry = Static<typeof entry>
    type Doc = Static<typeof doc>
    type _AssertEntry = Entry extends Doc | Static<typeof desc> ? true : false
    const _assert: _AssertEntry = true
    expect(_assert).toBe(true)
  })

  it('resolves static types for literal unions', () => {
    const methodSchema = union([literal('get'), literal('post')] as const)

    type Method = Static<typeof methodSchema>
    type _AssertMethod = Method extends 'get' | 'post' ? true : false
    const _assert: _AssertMethod = true
    expect(_assert).toBe(true)
  })

  it('resolves static types for mapped literal unions', () => {
    const methods = ['get', 'post'] as const
    const methodSchema = union(methods.map((method) => literal(method)))

    type Method = Static<typeof methodSchema>
    type _AssertMethod = Method extends 'get' | 'post' ? true : false
    const _assert: _AssertMethod = true
    expect(_assert).toBe(true)
  })
})
