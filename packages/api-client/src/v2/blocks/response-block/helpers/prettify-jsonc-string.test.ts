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
})
