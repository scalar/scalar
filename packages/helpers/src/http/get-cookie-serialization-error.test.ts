import { describe, expect, it } from 'vitest'

import { getCookieSerializationError } from './get-cookie-serialization-error'

describe('get-cookie-serialization-error', () => {
  it.each([undefined, 'form', 'cookie'])('reports non-exploded structured cookies with style %s', (style) => {
    const parameter = { name: 'color', in: 'cookie', style, explode: false }
    const message = `Cookie parameter "color" cannot serialize an array or object with style: ${style ?? 'form'} and explode: false because comma-separated cookie values are invalid. Use style: cookie with explode: true.`
    for (const value of [[], ['blue', 'black'], {}, { R: 100 }]) {
      expect(getCookieSerializationError(parameter, value)).toBe(message)
    }
    for (const schema of [
      { type: 'array' },
      { type: 'object' },
      { type: ['null', 'array'] },
      { anyOf: [{ type: 'null' }, { type: 'array' }] },
      { oneOf: [{ allOf: [{ type: 'object' }] }] },
    ]) {
      expect(getCookieSerializationError({ ...parameter, schema })).toBe(message)
    }
  })

  it('leaves primitive values, other locations and exploded cookies alone', () => {
    const parameter = { name: 'color', in: 'cookie', explode: false }
    for (const value of ['blue', 42, false, null, undefined]) {
      expect(getCookieSerializationError(parameter, value)).toBeUndefined()
    }
    for (const overrides of [{ in: 'query' }, { in: 'header' }, { explode: true }, { explode: undefined }]) {
      expect(getCookieSerializationError({ ...parameter, ...overrides }, ['blue'])).toBeUndefined()
    }
  })

  it('terminates on circular schema composition', () => {
    const schema: { anyOf: unknown[] } = { anyOf: [] }
    schema.anyOf.push(schema, { type: 'array' })
    expect(getCookieSerializationError({ name: 'color', in: 'cookie', explode: false, schema })).toBe(
      'Cookie parameter "color" cannot serialize an array or object with style: form and explode: false because comma-separated cookie values are invalid. Use style: cookie with explode: true.',
    )
  })
})
