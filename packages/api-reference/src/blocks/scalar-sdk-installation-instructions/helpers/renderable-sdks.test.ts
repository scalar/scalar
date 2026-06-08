import { describe, expect, it } from 'vitest'

import { getRenderableSdks } from './renderable-sdks'

describe('getRenderableSdks', () => {
  it('returns an empty array for undefined', () => {
    expect(getRenderableSdks(undefined)).toEqual([])
  })

  it('keeps entries that have a description', () => {
    const sdks = [
      { lang: 'TypeScript', description: 'Install for TypeScript' },
      { lang: 'Python', description: 'Install for Python' },
    ]

    expect(getRenderableSdks(sdks)).toEqual(sdks)
  })

  it('drops entries without a description', () => {
    expect(
      getRenderableSdks([{ lang: 'TypeScript', description: 'Install for TypeScript' }, { lang: 'Empty' }]),
    ).toEqual([{ lang: 'TypeScript', description: 'Install for TypeScript' }])
  })

  it('drops entries with an empty description', () => {
    expect(getRenderableSdks([{ lang: 'TypeScript', description: '' }])).toEqual([])
  })

  it('drops entries whose lang is not a string', () => {
    // A non-string lang would crash the icon lookup, so it must not survive.
    expect(
      getRenderableSdks([
        // @ts-expect-error — exercising a runtime shape the types forbid
        { lang: 42, description: 'Install' },
        { lang: 'Go', description: 'Install for Go' },
      ]),
    ).toEqual([{ lang: 'Go', description: 'Install for Go' }])
  })

  it('returns an empty array for malformed (non-array) extension values', () => {
    // The extension comes from an untrusted document, so invalid shapes must
    // fall back rather than throw.
    const malformed = [{ lang: 'TypeScript', description: 'Install' }, 'oops', 42, null, {}]

    for (const value of malformed.slice(1)) {
      // @ts-expect-error — exercising runtime shapes the types forbid
      expect(getRenderableSdks(value)).toEqual([])
    }
  })
})
