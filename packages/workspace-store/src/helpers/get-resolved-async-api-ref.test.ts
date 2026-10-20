import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { getResolvedAsyncApiRef } from './get-resolved-async-api-ref'
import { getResolvedRef, mergeSiblingReferences } from './get-resolved-ref'

describe('get-resolved-async-api-ref', () => {
  it('ignores siblings at every hop without changing the document or OpenAPI resolution', () => {
    const target = { title: 'Target', address: 'events' }
    const document = createMagicProxy({
      target,
      alias: { $ref: '#/target', title: 'Ignored alias', address: 'wrong' },
      ref: { $ref: '#/alias', title: 'Ignored outer' },
    })
    expect(getResolvedAsyncApiRef(document.ref)).toStrictEqual(target)
    expect(document.alias.title).toBe('Ignored alias')
    expect(getResolvedRef(document.alias, mergeSiblingReferences)).toStrictEqual({
      $ref: '#/target',
      title: 'Ignored alias',
      address: 'wrong',
    })
  })

  it.each([true, false])('preserves a boolean reference target: %j', (value) => {
    const reference = { $ref: '#/schema', '$ref-value': value, title: 'Ignored' }
    expect(getResolvedAsyncApiRef(reference)).toBe(value)
  })

  it('returns undefined for missing targets and circular aliases instead of sibling fallbacks', () => {
    const document = createMagicProxy({
      missing: { $ref: '#/absent', title: 'Ignored' },
      first: { $ref: '#/second', title: 'Ignored first' },
      second: { $ref: '#/first', title: 'Ignored second' },
    })
    expect(getResolvedAsyncApiRef(document.missing)).toBeUndefined()
    expect(getResolvedAsyncApiRef(document.first)).toBeUndefined()
  })

  it('keeps inline objects and lazy chunk targets intact', () => {
    const target = { title: 'Loaded' }
    const chunk = {
      $ref: './chunk.json',
      $global: true,
      $status: 'loading',
      '$ref-value': undefined as typeof target | undefined,
    }
    expect(getResolvedAsyncApiRef(target)).toBe(target)
    expect(getResolvedAsyncApiRef(chunk)).toBeUndefined()
    chunk['$ref-value'] = target
    expect(getResolvedAsyncApiRef(chunk)).toBe(target)
    expect(chunk.$status).toBe('loading')
  })
})
