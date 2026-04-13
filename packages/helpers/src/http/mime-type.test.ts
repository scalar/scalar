import { describe, expect, it } from 'vitest'

import { parseMimeType } from './mime-type'

describe('mime-type', () => {
  it('parses essence and charset from a content type', () => {
    const mimeType = parseMimeType('Text/Plain; charset=UTF-8')

    expect(mimeType.essence).toBe('text/plain')
    expect(mimeType.toString()).toBe('text/plain; charset=UTF-8')
    expect(mimeType.parameters.get('charset')).toBe('UTF-8')
  })

  it('defaults to text/plain when no content type is provided', () => {
    const mimeType = parseMimeType()

    expect(mimeType.essence).toBe('text/plain')
    expect(mimeType.parameters.size).toBe(0)
  })

  it('falls back to text/plain for invalid content type values', () => {
    const mimeType = parseMimeType('invalid content type')

    expect(mimeType.essence).toBe('text/plain')
  })

  it('normalizes bare essence values', () => {
    const mimeType = parseMimeType('Application/Json')

    expect(mimeType.essence).toBe('application/json')
    expect(mimeType.toString()).toBe('application/json')
  })

  it('preserves quoted parameter values', () => {
    const mimeType = parseMimeType('text/plain; charset="utf-8"; foo=bar')

    expect(mimeType.parameters.get('charset')).toBe('utf-8')
    expect(mimeType.parameters.get('foo')).toBe('bar')
    expect(mimeType.toString()).toBe('text/plain; charset=utf-8; foo=bar')
  })

  it('skips malformed parameters with an empty value', () => {
    const mimeType = parseMimeType('text/plain; charset=')

    expect(mimeType.parameters.get('charset')).toBeUndefined()
    expect(mimeType.toString()).toBe('text/plain')
  })
})
