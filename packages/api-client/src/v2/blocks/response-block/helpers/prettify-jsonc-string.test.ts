import { describe, expect, it } from 'vitest'

import { prettifyJsoncString } from './prettify-jsonc-string'

describe('prettifyJsoncString', () => {
  it('formats minified JSON without changing large integer digit sequences', () => {
    const id = '9007199254740993'
    const minified = `{"id":${id}}`
    const out = prettifyJsoncString(minified)
    expect(out).toContain(id)
    expect(out).not.toContain('9007199254740992')
    expect(out).toContain('\n')
  })

  it('returns the original string when formatting produces no edits', () => {
    const s = 'not json'
    expect(prettifyJsoncString(s)).toBe(s)
  })

  it('keeps JSONC comments and orders multiple edits against the original text', () => {
    const source = '{  "items":[9007199254740993,  2], // comment\r\n"enabled":true }'
    expect(prettifyJsoncString(source)).toBe(
      '{\r\n  "items": [\r\n    9007199254740993,\r\n    2\r\n  ], // comment\r\n  "enabled": true\r\n}',
    )
  })
})
