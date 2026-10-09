import { describe, expect, it } from 'vitest'

import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'

import { getXmlBodyExample } from './get-xml-body-example'

const schema = { type: 'string', xml: { name: 'message' }, example: '<not-markup/>' } as SchemaObject
const options = { xmlDeclaration: false, format: false }

describe('get-xml-body-example', () => {
  it('preserves serializedValue over dataValue', () => {
    expect(
      getXmlBodyExample(schema, { dataValue: 'hello', serializedValue: '<message>custom</message>\n' }, options),
    ).toStrictEqual({ xml: '<message>custom</message>\n', diagnostics: [] })
  })
  it('serializes string dataValue and schema examples as text', () => {
    expect(getXmlBodyExample(schema, { dataValue: '<hello/>' }, options).xml).toBe('<message>&lt;hello/&gt;</message>')
    expect(getXmlBodyExample(schema, undefined, options).xml).toBe('<message>&lt;not-markup/&gt;</message>')
  })
  it('preserves legacy media-level strings, including empty edited bodies', () => {
    expect(getXmlBodyExample(schema, { value: '' }, options)).toStrictEqual({ xml: '', diagnostics: [] })
    expect(getXmlBodyExample(schema, { value: '<hello/>\n' }, options).xml).toBe('<hello/>\n')
  })
  it('falls back to generation for unresolved external examples', () => {
    expect(getXmlBodyExample(schema, { externalValue: './example.xml' }, options).xml).toBe(
      '<message>&lt;not-markup/&gt;</message>',
    )
  })
  it('serializes false, zero and null data values without treating them as missing', () => {
    expect(getXmlBodyExample(schema, { dataValue: false }, options).xml).toBe('<message>false</message>')
    expect(getXmlBodyExample(schema, { dataValue: 0 }, options).xml).toBe('<message>0</message>')
    expect(getXmlBodyExample(schema, { dataValue: null }, options).xml).toBe(
      '<message xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:nil="true"/>',
    )
  })
  it('resolves referenced media examples before interpreting their provenance', () => {
    expect(
      getXmlBodyExample(undefined, {
        $ref: '#/components/examples/Person',
        '$ref-value': { serializedValue: '<person/>\n' },
      }),
    ).toStrictEqual({ xml: '<person/>\n', diagnostics: [] })
  })
})
