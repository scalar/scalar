import { describe, expect, it } from 'vitest'

import { getExampleValue, getJsonExampleText } from './get-example-value'

describe('get-example-value', () => {
  it.each([false, 0, null, '', { id: 1 }])('selects structured data without losing %j', (value) => {
    expect(getExampleValue({ dataValue: value, value: 'legacy' })).toStrictEqual({ source: 'data', value })
  })

  it('prefers serialized content without mutating the authored example', () => {
    const example = { serializedValue: '', dataValue: false, value: 'legacy' }
    expect(getExampleValue(example)).toStrictEqual({ source: 'serialized', value: '' })
    expect(example).toStrictEqual({ serializedValue: '', dataValue: false, value: 'legacy' })
  })

  it('resolves referenced examples and preserves legacy values', () => {
    expect(
      getExampleValue({ $ref: '#/components/examples/message', '$ref-value': { dataValue: 'hello' } }),
    ).toStrictEqual({
      source: 'data',
      value: 'hello',
    })
    expect(getExampleValue({ value: false })).toStrictEqual({ source: 'value', value: false })
    expect(getExampleValue({ externalValue: '/example.json' })).toBeUndefined()
    expect(getExampleValue(undefined)).toBeUndefined()
  })

  it.each(['application/json', 'application/problem+json; charset=utf-8'])(
    'quotes structured strings for %s',
    (type) => {
      expect(getJsonExampleText(getExampleValue({ dataValue: '{"id":1}' }), type)).toBe('"{\\"id\\":1}"')
      expect(getJsonExampleText(getExampleValue({ serializedValue: ' { "id": 1 }\n' }), type)).toBe(' { "id": 1 }\n')
      expect(getJsonExampleText(getExampleValue({ dataValue: false }), type)).toBe('false')
      expect(getJsonExampleText(getExampleValue({ dataValue: null }), type)).toBe('null')
    },
  )

  it('leaves format-specific encoding to its consumer', () => {
    expect(getJsonExampleText(getExampleValue({ dataValue: { id: 1 } }), 'application/xml')).toBeUndefined()
    expect(getJsonExampleText(getExampleValue({ serializedValue: '<id>1</id>' }), 'application/xml')).toBe('<id>1</id>')
    expect(getJsonExampleText(getExampleValue({ value: 'legacy' }), 'application/json')).toBeUndefined()
  })
})
