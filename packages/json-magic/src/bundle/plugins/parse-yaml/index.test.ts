import { parseYaml } from '@/bundle/plugins/parse-yaml'
import { describe, expect, it } from 'vitest'

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
    })
  })
})
