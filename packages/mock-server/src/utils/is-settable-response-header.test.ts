import { describe, expect, it } from 'vitest'

import { isSettableResponseHeader } from './is-settable-response-header'

describe('is-settable-response-header', () => {
  it.each(['', 'plain text', 'a\tb', 'café', '\xff'])('accepts an HTTP field value %j', (value) => {
    expect(isSettableResponseHeader('X-Test', value)).toBe(true)
  })

  it.each(['', 'Bad Name', 'Bad:Name', 'Bad\r\nName', 'Bad\n', 'Café', 'Bad\u2028'])(
    'rejects an invalid name %j',
    (name) => {
      expect(isSettableResponseHeader(name, 'value')).toBe(false)
    },
  )

  it.each(['a\r\nb', 'a\nb', 'a\0b', 'a\x01b', 'a\x7fb', 'snowman ☃', 'final\n'])(
    'rejects an invalid value %j',
    (value) => {
      expect(isSettableResponseHeader('X-Test', value)).toBe(false)
    },
  )
})
