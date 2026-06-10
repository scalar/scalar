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

  it('uses the legacy source as the description when there is no description', () => {
    expect(getRenderableSdks([{ lang: 'Go', source: 'go get example.com/sdk' }])).toEqual([
      { lang: 'Go', description: 'go get example.com/sdk' },
    ])
  })

  it('appends the legacy source to the description as plain text', () => {
    expect(
      getRenderableSdks([{ lang: 'Node', description: 'Install from npm:', source: 'npm install @scalar/sdk' }]),
    ).toEqual([{ lang: 'Node', description: 'Install from npm:\nnpm install @scalar/sdk' }])
  })

  it('collapses Markdown fenced code blocks to their contents', () => {
    const description = ['```properties', 'pip install scalar-warp-api', '```'].join('\n')

    expect(getRenderableSdks([{ lang: 'Python', description }])).toEqual([
      { lang: 'Python', description: 'pip install scalar-warp-api' },
    ])
  })

  it('collapses tilde fenced code blocks to their contents', () => {
    const description = ['~~~sh', 'npm install scalar-warp-api', '~~~'].join('\n')

    expect(getRenderableSdks([{ lang: 'TypeScript', description }])).toEqual([
      { lang: 'TypeScript', description: 'npm install scalar-warp-api' },
    ])
  })

  it('keeps indented code text when there are no Markdown fences', () => {
    const description = ['Install with Make:', '', '    make install'].join('\n')

    expect(getRenderableSdks([{ lang: 'C', description }])).toEqual([{ lang: 'C', description }])
  })

  it('keeps legacy source backticks as plain text', () => {
    expect(getRenderableSdks([{ lang: 'Shell', source: 'echo ```nested```' }])).toEqual([
      { lang: 'Shell', description: 'echo ```nested```' },
    ])
  })

  it('drops entries that carry neither a description nor a source', () => {
    expect(getRenderableSdks([{ lang: 'Empty' }, { lang: 'Blank', description: '', source: '   ' }])).toEqual([])
  })
})
