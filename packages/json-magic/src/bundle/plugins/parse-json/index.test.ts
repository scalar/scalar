import { parseJson } from '@/bundle/plugins/parse-json'
import { describe, expect, it } from 'vitest'

describe('parse-json', () => {
  it.each([
    ['{}', true],
    ['{ "a": "b" }', true],
    ['{ "a": 2 }', true],
    ["{ 'a': 2 }", false],
    ['{ some string', false],
    ['{ ', false],
  ])('should validate if strings are json valid format', (a, b) => {
    expect(parseJson().validate(a)).toBe(b)
  })

  it('should parse json string', async () => {
    expect(await parseJson().exec('{ "message": "Hello World" }')).toEqual({
      ok: true,
      data: { message: 'Hello World' },
    })
  })
})
