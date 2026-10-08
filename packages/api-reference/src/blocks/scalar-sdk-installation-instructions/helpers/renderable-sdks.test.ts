import { describe, expect, it } from 'vitest'

import { getRenderableSdks, hasRenderableSdks } from './renderable-sdks'

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
      { lang: 'Go', description: '```\ngo get example.com/sdk\n```' },
    ])
  })

  it('appends the legacy source to the description as a fenced code block', () => {
    expect(
      getRenderableSdks([{ lang: 'Node', description: 'Install from npm:', source: 'npm install @scalar/sdk' }]),
    ).toEqual([{ lang: 'Node', description: 'Install from npm:\n\n```\nnpm install @scalar/sdk\n```' }])
  })

  it('keeps the description verbatim so indented code blocks survive', () => {
    const description = ['Install with Make:', '', '    make install'].join('\n')

    expect(getRenderableSdks([{ lang: 'C', description }])).toEqual([{ lang: 'C', description }])
  })

  it('keeps the source inside one code block even when it contains backticks', () => {
    expect(getRenderableSdks([{ lang: 'Shell', source: 'echo ```nested```' }])).toEqual([
      { lang: 'Shell', description: '````\necho ```nested```\n````' },
    ])
  })

  it('drops entries that carry neither a description nor a source', () => {
    expect(getRenderableSdks([{ lang: 'Empty' }, { lang: 'Blank', description: '', source: '   ' }])).toEqual([])
  })
})

describe('hasRenderableSdks', () => {
  const openApi = (info: Record<string, unknown>) =>
    ({ openapi: '3.1.0', info: { title: 'API', version: '1.0.0', ...info } }) as unknown as Parameters<
      typeof hasRenderableSdks
    >[0]

  it('is true when the document lists an SDK with something to render', () => {
    expect(
      hasRenderableSdks(openApi({ 'x-scalar-sdk-installation': [{ lang: 'Node', source: 'npm i @acme/sdk' }] })),
    ).toBe(true)
  })

  it('is false when the SDK entries have nothing to render', () => {
    expect(hasRenderableSdks(openApi({ 'x-scalar-sdk-installation': [{ lang: 'Node' }] }))).toBe(false)
  })

  it('is false without the extension or with a malformed one', () => {
    expect(hasRenderableSdks(openApi({}))).toBe(false)
    expect(hasRenderableSdks(openApi({ 'x-scalar-sdk-installation': 'npm i @acme/sdk' }))).toBe(false)
  })

  it('is false for AsyncAPI documents and missing documents', () => {
    const asyncApi = { asyncapi: '3.0.0', info: { title: 'Events', version: '1.0.0' } } as unknown as Parameters<
      typeof hasRenderableSdks
    >[0]

    expect(hasRenderableSdks(asyncApi)).toBe(false)
    expect(hasRenderableSdks(undefined)).toBe(false)
  })
})
