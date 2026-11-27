import { describe, expect, it } from 'vitest'

import { matchPropertyPattern } from './match-property-pattern'

describe('match-property-pattern', () => {
  it.each([
    ['^code_', 'code_a', true],
    ['^code_', 'other', false],
    ['^[a-z]+$', 'person', true],
    ['^x-.*$', 'x-example', true],
    ['^(.*)$', 'property', true],
    ['^(foo|bar)$', 'bar', true],
    ['^(foo|bar)$', 'baz', false],
    ['[+()*|]+', '+++', true],
    ['\\(literal\\)', '(literal)', true],
  ] as const)('matches bounded pattern %s against %s', (pattern, name, expected) => {
    expect(matchPropertyPattern(pattern, name)).toBe(expected)
  })

  it.each(['^(a+)+$', '(a|aa)+', 'a*a*', 'a{9999999}', '(a)\\1', '['])(
    'rejects unsafe or unsupported pattern %s',
    (pattern) => {
      expect(matchPropertyPattern(pattern, 'a'.repeat(24) + '!')).toBeUndefined()
    },
  )

  it('bounds both inputs before compiling or matching', () => {
    expect(matchPropertyPattern('a'.repeat(257), 'a')).toBeUndefined()
    expect(matchPropertyPattern('a+', 'a'.repeat(257))).toBeUndefined()
  })
})
