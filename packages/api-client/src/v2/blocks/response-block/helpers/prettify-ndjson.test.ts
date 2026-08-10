import { describe, expect, it } from 'vitest'

import { prettifyNdjson } from './prettify-ndjson'

describe('prettifyNdjson', () => {
  it('pretty-prints each line and separates records with a blank line', () => {
    const content = '{"a":1}\n{"b":2}'

    expect(prettifyNdjson(content)).toBe('{\n  "a": 1\n}\n\n{\n  "b": 2\n}')
  })

  it('ignores empty lines and trailing newlines', () => {
    const content = '{"a":1}\n\n{"b":2}\n'

    expect(prettifyNdjson(content)).toBe('{\n  "a": 1\n}\n\n{\n  "b": 2\n}')
  })

  it('passes malformed lines through unchanged', () => {
    const content = '{"a":1}\nnot json\n{"b":2}'

    expect(prettifyNdjson(content)).toBe('{\n  "a": 1\n}\n\nnot json\n\n{\n  "b": 2\n}')
  })

  it('returns an empty string for empty input', () => {
    expect(prettifyNdjson('')).toBe('')
  })
})
