import { describe, expect, it } from 'vitest'

import { parseYaml } from '@/bundle/plugins/parse-yaml'

/**
 * `headers` is referenced ten times (nine `use` keys and `params`), so its count is 11 and every merge
 * of `base` costs 11. With yaml 2.9.1, 1,000 merges need a `maxAliasCount` of 11,011 (1,011 before
 * merges counted).
 */
const createMergeHeavyYaml = (): string =>
  [
    'headers: &headers',
    '  accept: application/json',
    ...Array.from({ length: 9 }, (_, index) => `use${index}: *headers`),
    'base: &base',
    '  type: aws',
    '  params: *headers',
    ...Array.from({ length: 1000 }, (_, index) => `item${index}:\n  <<: *base\n  title: item${index}`),
  ].join('\n')

describe('parse-yaml', () => {
  it.each([
    ['hi: hello\n', true],
    ['- some: 1\n', true],
    ['valid: value\nhey: hi\n', true],
    ["{ 'a': 2 }", false],
    ['{ some string', false],
    ['{ ', false],
    ['{}', false],
    ['{ "json": "" }', false],
  ])('should validate if strings are yaml valid format', (a, b) => {
    expect(parseYaml().validate(a)).toBe(b)
  })

  it('should parse yaml string', async () => {
    expect(await parseYaml().exec('{ "message": "Hello World" }')).toEqual({
      ok: true,
      data: { message: 'Hello World' },
      'raw': '{ "message": "Hello World" }',
    })
  })

  it('parses documents whose merges exceed the old alias limit of 10,000', async () => {
    const result = await parseYaml().exec(createMergeHeavyYaml())

    expect(result.ok).toBe(true)
    expect(result.ok && result.data).toHaveProperty(
      'item999',
      expect.objectContaining({ type: 'aws', title: 'item999' }),
    )
  })
})
