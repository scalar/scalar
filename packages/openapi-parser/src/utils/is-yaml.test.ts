import { describe, expect, it } from 'vitest'

import { isYaml } from './is-yaml'

describe('is-yaml', () => {
  it('detects yaml', () => {
    expect(isYaml('openapi: 3.1.0\ninfo:\n  title: Example\n')).toBe(true)
  })

  it('detects yaml whose aliases exceed the old alias limit of 10,000', () => {
    // `headers` is referenced ten times (nine `use` keys and `params`), so its count is 11 and every
    // use of `base` costs 11. 1,000 uses need a `maxAliasCount` of 11,011.
    const value = [
      'headers: &headers',
      '  accept: application/json',
      ...Array.from({ length: 9 }, (_, index) => `use${index}: *headers`),
      'base: &base',
      '  type: aws',
      '  params: *headers',
      ...Array.from({ length: 1000 }, (_, index) => `item${index}: *base`),
    ].join('\n')

    expect(isYaml(value)).toBe(true)
  })
})
