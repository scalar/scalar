import { describe, expect, it } from 'vitest'

import { escapeJsonForInlineScript } from './escape-json-for-inline-script'

describe('escape-json-for-inline-script', () => {
  it('escapes HTML control characters and line separators without changing JSON values', () => {
    const value = { '</ScRiPt><!--<script>': ['<>&\u2028\u2029', '"\\', '\\u003c', null, 42, true] }
    const escaped = escapeJsonForInlineScript(JSON.stringify(value))

    expect(escaped).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(escaped)).toStrictEqual(value)
  })

  it('leaves JSON without special characters unchanged', () => {
    expect(escapeJsonForInlineScript('{"value":123}')).toBe('{"value":123}')
  })
})
