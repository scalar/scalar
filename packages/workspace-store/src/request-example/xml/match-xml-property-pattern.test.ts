import { describe, expect, it } from 'vitest'

import { matchXmlPropertyPattern } from './match-xml-property-pattern'

describe('match-xml-property-pattern', () => {
  it.each([
    ['^code_', 'code_a', true],
    ['^code_', 'other', false],
    ['^[a-z]+$', 'person', true],
    ['^x-.*$', 'x-example', true],
    ['[+()*|]+', '+++', true],
    ['\\(literal\\)', '(literal)', true],
  ] as const)('matches bounded pattern %s against %s', (pattern, name, expected) => {
    expect(matchXmlPropertyPattern(pattern, name)).toBe(expected)
  })

  it.each(['^(a+)+$', '(a|aa)+', 'a*a*', 'a{9999999}', '(a)\\1', '['])(
    'rejects unsafe or unsupported pattern %s',
    (pattern) => {
      expect(matchXmlPropertyPattern(pattern, 'a'.repeat(24) + '!')).toBeUndefined()
    },
  )

  it('bounds both inputs before compiling or matching', () => {
    expect(matchXmlPropertyPattern('a'.repeat(257), 'a')).toBeUndefined()
    expect(matchXmlPropertyPattern('a+', 'a'.repeat(257))).toBeUndefined()
  })
})
