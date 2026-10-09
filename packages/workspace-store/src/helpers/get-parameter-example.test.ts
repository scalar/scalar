import { describe, expect, it } from 'vitest'

import { getParameterExample } from './get-parameter-example'

describe('get-parameter-example', () => {
  it.each([false, 0, null, '', { id: 1 }])('retains structured data %j', (value) => {
    const example = { dataValue: value }
    expect(getParameterExample({ name: 'q', in: 'query', examples: { default: example } })).toStrictEqual({
      example,
      value,
      serialized: false,
      mediaSerialized: false,
    })
  })

  it('distinguishes parameter-level wire text from media text', () => {
    const example = { serializedValue: 'q=%22hello%22' }
    expect(
      getParameterExample({
        name: 'q',
        in: 'query',
        examples: { default: example },
        content: { 'application/json': {} },
      }),
    ).toStrictEqual({ example, value: 'q=%22hello%22', serialized: true, mediaSerialized: false })
    const media = { serializedValue: '"hello"' }
    expect(
      getParameterExample({
        name: 'q',
        in: 'query',
        content: { 'application/json': { examples: { default: media } } },
      }),
    ).toStrictEqual({ example: media, value: '"hello"', serialized: false, mediaSerialized: true })
  })

  it('serializes structured JSON strings once at media level', () => {
    const example = { dataValue: 'hello' }
    expect(
      getParameterExample({
        name: 'q',
        in: 'query',
        content: { 'application/json': { examples: { default: example } } },
      }),
    ).toStrictEqual({ example, value: '"hello"', serialized: false, mediaSerialized: true })
  })
})
