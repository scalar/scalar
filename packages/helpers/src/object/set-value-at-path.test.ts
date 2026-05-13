import { describe, expect, it } from 'vitest'

import { setValueAtPath } from './set-value-at-path'

describe('setValueAtPath', () => {
  it('sets a value at a top-level path', () => {
    const target: Record<string, unknown> = {}

    setValueAtPath(target, ['name'], 'Scalar')

    expect(target).toEqual({ name: 'Scalar' })
  })

  it('creates intermediate objects as needed', () => {
    const target: Record<string, unknown> = {}

    setValueAtPath(target, ['filter', 'status'], 'active')

    expect(target).toEqual({ filter: { status: 'active' } })
  })

  it('preserves existing nested objects', () => {
    const target: Record<string, unknown> = { filter: { existing: true } }

    setValueAtPath(target, ['filter', 'status'], 'active')

    expect(target).toEqual({ filter: { existing: true, status: 'active' } })
  })

  it('replaces non-object intermediate values with new objects', () => {
    const target: Record<string, unknown> = { filter: 'previous' }

    setValueAtPath(target, ['filter', 'status'], 'active')

    expect(target).toEqual({ filter: { status: 'active' } })
  })

  it('replaces array intermediate values with new objects', () => {
    const target: Record<string, unknown> = { filter: ['previous'] }

    setValueAtPath(target, ['filter', 'status'], 'active')

    expect(target).toEqual({ filter: { status: 'active' } })
  })

  it('does nothing when the path is empty', () => {
    const target: Record<string, unknown> = { existing: true }

    setValueAtPath(target, [], 'value')

    expect(target).toEqual({ existing: true })
  })

  it('throws when the path contains a prototype-pollution key', () => {
    const target: Record<string, unknown> = {}

    expect(() => setValueAtPath(target, ['__proto__', 'polluted'], true)).toThrow()
  })

  it('supports null and undefined leaf values', () => {
    const target: Record<string, unknown> = {}

    setValueAtPath(target, ['a', 'b'], null)
    setValueAtPath(target, ['a', 'c'], undefined)

    expect(target).toEqual({ a: { b: null, c: undefined } })
  })
})
