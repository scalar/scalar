import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getExampleContent } from './get-example-content'

describe('get-example-content', () => {
  it('bounds expansion of shared legacy response examples', () => {
    const value = Array.from({ length: 16 }).reduce<Record<string, unknown>>(
      (shared) => ({ left: shared, right: shared }),
      { id: 1 },
    )
    const expected = Array.from({ length: 16 }).reduce<Record<string, unknown>>(
      (left) => ({ left, right: '[Circular]' }),
      { id: 1 },
    )

    expect(getExampleContent(undefined, { value })).toBe(JSON.stringify(expected, null, 2))
  })

  it('preserves serialized content exactly for display and copy', () => {
    expect(getExampleContent(undefined, { serializedValue: '  { "id": 1 }\n', dataValue: { id: 2 } })).toBe(
      '  { "id": 1 }\n',
    )
  })

  it.each([false, 0, null, '', 'hello', '{"id":1}'])('renders structured JSON %j as data', (value) => {
    expect(getExampleContent(undefined, { dataValue: value })).toBe(JSON.stringify(value, null, 2))
  })

  it('does not JSON-quote structured text responses', () => {
    expect(getExampleContent(undefined, { dataValue: 'hello' }, { contentType: 'text/plain' })).toBe('hello')
  })

  it('preserves explicit legacy null response examples', () => {
    expect(getExampleContent(undefined, { value: null })).toBe('null')
  })

  it('keeps legacy formatted JSON examples', () => {
    expect(getExampleContent(undefined, { value: '{"id":1}' })).toBe('{\n  "id": 1\n}')
  })
  it('accepts content type and composition selection together', () => {
    const response = {
      schema: coerceValue(SchemaObjectSchema, {
        oneOf: [
          { type: 'string', const: 'first' },
          { type: 'string', const: 'second' },
        ],
      }),
    }
    const options = { contentType: 'text/plain', compositionSelection: { oneOf: 1 } }
    expect(getExampleContent(response, undefined, options)).toBe('second')
    expect(getExampleContent(response, { value: 'explicit' }, options)).toBe('explicit')
    expect(getExampleContent(response, { dataValue: 'explicit' }, options)).toBe('explicit')
    expect(getExampleContent(response, { dataValue: 'explicit' }, { ...options, contentType: 'application/json' })).toBe('"explicit"')
    expect(getExampleContent(response, { serializedValue: '  explicit\n' }, options)).toBe('  explicit\n')
  })
})
