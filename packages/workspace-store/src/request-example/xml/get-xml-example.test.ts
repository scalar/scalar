import { describe, expect, it } from 'vitest'

import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'

import { getExampleFromSchema } from '../builder/helpers/get-example-from-schema'
import { getXmlExampleFromSchema, serializeXmlExample } from './get-xml-example'

const compact = { format: false, xmlDeclaration: false }
const schema = (value: unknown): SchemaObject => value as SchemaObject

describe('get-xml-example', () => {
  it('renders renamed children, attributes, namespaces, and duplicate sibling names', () => {
    const input = schema({
      type: 'object',
      xml: { name: 'person' },
      properties: {
        id: { type: 'integer', example: 7, xml: { attribute: true } },
        first: { type: 'string', example: 'Ada', xml: { name: 'name' } },
        last: { type: 'string', example: 'Lovelace', xml: { name: 'name', namespace: 'urn:family', prefix: 'f' } },
        alias: { type: 'string', example: 'A', xml: { name: 'name' } },
      },
    })
    expect(getXmlExampleFromSchema(input, compact)).toStrictEqual({
      xml: '<person id="7"><name>Ada</name><f:name xmlns:f="urn:family">Lovelace</f:name><name>A</name></person>',
      diagnostics: [],
    })
    expect(getExampleFromSchema(input)).toStrictEqual({ id: 7, first: 'Ada', last: 'Lovelace', alias: 'A' })
  })

  it.each([false, true])('renders multiple array items with wrapped=%s', (wrapped) => {
    const input = schema({
      type: 'object',
      xml: { name: 'person' },
      properties: {
        photos: {
          type: 'array',
          xml: { name: 'images', wrapped },
          items: { type: 'string', xml: { name: 'photo' } },
          example: ['a', 'b'],
        },
      },
    })
    expect(getXmlExampleFromSchema(input, compact).xml).toBe(
      wrapped
        ? '<person><images><photo>a</photo><photo>b</photo></images></person>'
        : '<person><photo>a</photo><photo>b</photo></person>',
    )
  })

  it('keeps the property name for unnamed items inside a renamed wrapper', () => {
    expect(
      getXmlExampleFromSchema(
        schema({
          type: 'object',
          xml: { name: 'root' },
          properties: {
            books: { type: 'array', xml: { name: 'library', wrapped: true }, items: { type: 'string', example: 'a' } },
          },
        }),
        compact,
      ).xml,
    ).toBe('<root><library><books>a</books></library></root>')
  })

  it('applies XML metadata to explicit object examples without inventing missing properties', () => {
    const input = schema({
      type: 'object',
      xml: { name: 'person' },
      example: { id: 0 },
      properties: {
        id: { type: 'integer', xml: { attribute: true } },
        name: { type: 'string', default: 'Invented' },
      },
    })
    expect(getXmlExampleFromSchema(input, compact)).toStrictEqual({ xml: '<person id="0"/>', diagnostics: [] })
    expect(serializeXmlExample({ id: false }, input, compact).xml).toBe('<person id="false"/>')
  })

  it('supports attributes with text, CDATA, and transparent object nodes in OpenAPI 3.2', () => {
    const input = schema({
      type: 'object',
      xml: { name: 'message' },
      properties: {
        language: { type: 'string', example: 'en', xml: { nodeType: 'attribute' } },
        content: {
          type: 'object',
          xml: { nodeType: 'none' },
          properties: {
            before: { type: 'string', example: 'Hello ', xml: { nodeType: 'text' } },
            name: { type: 'string', example: 'Ada' },
            after: { type: 'string', example: '<3', xml: { nodeType: 'cdata' } },
          },
        },
      },
    })
    expect(getXmlExampleFromSchema(input, { ...compact, openapiVersion: '3.2.0' })).toStrictEqual({
      xml: '<message language="en">Hello <name>Ada</name><![CDATA[<3]]></message>',
      diagnostics: [],
    })
  })

  it('generates an ordered mixed-content tuple through the shared evaluator', () => {
    const input = schema({
      type: 'array',
      xml: { nodeType: 'element', name: 'report' },
      prefixItems: [
        { type: 'string', example: 'Before ', xml: { nodeType: 'text' } },
        { type: 'integer', example: 42, xml: { name: 'data' } },
        { type: 'string', example: ' after.', xml: { nodeType: 'text' } },
      ],
    })
    expect(getXmlExampleFromSchema(input, compact)).toStrictEqual({
      xml: '<report>Before <data>42</data> after.</report>',
      diagnostics: [],
    })
    expect(getExampleFromSchema(input)).toStrictEqual(['Before ', 42, ' after.'])
  })

  it('uses the selected branch metadata for generated and supplied examples', () => {
    const input = schema({
      oneOf: [
        {
          type: 'object',
          xml: { name: 'cat' },
          properties: { name: { type: 'string', example: 'Kit', xml: { attribute: true } } },
        },
        {
          type: 'object',
          xml: { name: 'dog' },
          properties: { name: { type: 'string', example: 'Rex', xml: { name: 'label' } } },
        },
      ],
    })
    const options = { ...compact, compositionSelection: { 'requestBody.oneOf': 1 }, schemaPath: ['requestBody'] }
    expect(getXmlExampleFromSchema(input, options)).toStrictEqual({
      xml: '<dog><label>Rex</label></dog>',
      diagnostics: [],
    })
    expect(serializeXmlExample({ name: 'Spot' }, input, options).xml).toBe('<dog><label>Spot</label></dog>')
  })

  it('keeps ordinal composition selections inside allOf', () => {
    const input = schema({
      xml: { name: 'root' },
      allOf: [
        {
          oneOf: [
            { properties: { a: { example: 'one' } } },
            { properties: { a: { example: 'two', xml: { attribute: true } } } },
          ],
        },
        { oneOf: [{ properties: { b: { example: 'three' } } }, { properties: { b: { example: 'four' } } }] },
      ],
    })
    expect(
      getXmlExampleFromSchema(input, { ...compact, compositionSelection: { '0.oneOf': 1, '1.oneOf': 1 } }).xml,
    ).toBe('<root a="two"><b>four</b></root>')
  })

  it('retains component root names and reference siblings', () => {
    const input = schema({
      $ref: '#/components/schemas/Person',
      '$ref-value': { type: 'object', properties: { id: { example: 1 } } },
    })
    expect(getXmlExampleFromSchema(input, compact)).toStrictEqual({
      xml: '<Person><id>1</id></Person>',
      diagnostics: [],
    })
    expect(getXmlExampleFromSchema(schema({ ...input, xml: { name: 'User' } }), compact).xml).toBe(
      '<User><id>1</id></User>',
    )
  })

  it('retains selected component names through compositions', () => {
    const input = schema({
      oneOf: [
        {
          $ref: '#/components/schemas/Person',
          '$ref-value': {
            type: 'object',
            properties: { id: { type: 'integer', example: 7, xml: { attribute: true } } },
          },
        },
      ],
    })
    expect(getXmlExampleFromSchema(input, compact)).toStrictEqual({ xml: '<Person id="7"/>', diagnostics: [] })
    expect(serializeXmlExample({ id: 8 }, input, compact)).toStrictEqual({ xml: '<Person id="8"/>', diagnostics: [] })
  })

  it('preserves read/write filtering for generated and supplied data', () => {
    const input = schema({
      xml: { name: 'root' },
      properties: {
        id: { example: 1, readOnly: true, xml: { attribute: true } },
        secret: { example: 's', writeOnly: true },
        retired: { example: 'old', deprecated: true },
      },
    })
    expect(getXmlExampleFromSchema(input, { ...compact, mode: 'write' }).xml).toBe('<root><secret>s</secret></root>')
    expect(serializeXmlExample({ id: 1, secret: 's', retired: 'old' }, input, { ...compact, mode: 'read' }).xml).toBe(
      '<root id="1"/>',
    )
  })

  it('represents null elements explicitly and reports omitted null attributes', () => {
    const input = schema({
      xml: { name: 'root' },
      properties: {
        a: { example: null },
        b: { example: null, xml: { attribute: true } },
      },
    })
    const result = getXmlExampleFromSchema(input, compact)
    expect(result.xml).toBe('<root><a xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:nil="true"/></root>')
    expect(result.diagnostics.map(({ code }) => code)).toStrictEqual(['null-attribute'])
  })

  it('reports a missing root name and rejects invalid attribute mappings', () => {
    expect(getXmlExampleFromSchema(schema({ type: 'string', example: 'a' }), compact)).toStrictEqual({
      xml: '<root>a</root>',
      diagnostics: [
        {
          severity: 'warning',
          code: 'root-name-fallback',
          message: 'No XML root name was supplied; using root.',
          path: [],
        },
      ],
    })
    expect(
      getXmlExampleFromSchema(
        schema({ xml: { name: 'root' }, properties: { a: { example: {}, xml: { attribute: true } } } }),
        compact,
      ).diagnostics.map(({ code }) => code),
    ).toStrictEqual(['attribute-value'])
  })

  it('rejects conflicting node declarations and composition XML mappings', () => {
    expect(
      getXmlExampleFromSchema(
        schema({ type: 'string', example: 'a', xml: { name: 'root', nodeType: 'element', attribute: true } }),
        compact,
      ).diagnostics.map(({ code }) => code),
    ).toStrictEqual(['conflicting-node-type'])
    expect(
      getXmlExampleFromSchema(
        schema({
          allOf: [
            { type: 'string', example: 'a', xml: { name: 'a' } },
            { type: 'string', example: 'b', xml: { name: 'b' } },
          ],
        }),
        compact,
      ).diagnostics.map(({ code }) => code),
    ).toStrictEqual(['composition-xml-conflict'])
  })

  it('rejects circular supplied values without mutating them', () => {
    const value: Record<string, unknown> = {}
    value.child = value
    expect(
      serializeXmlExample(value, schema({ xml: { name: 'root' } }), compact).diagnostics.map(({ code }) => code),
    ).toStrictEqual(['circular-value'])
    expect(value.child).toBe(value)
  })
  it('retains XML metadata across allOf contributions to the same property', () => {
    const input = schema({
      xml: { name: 'root' },
      allOf: [
        { properties: { id: { type: 'integer', xml: { attribute: true } } } },
        { properties: { id: { type: 'integer', example: 42 } } },
      ],
    })
    expect(getXmlExampleFromSchema(input, compact)).toStrictEqual({ xml: '<root id="42"/>', diagnostics: [] })
    expect(serializeXmlExample({ id: 8 }, input, compact).xml).toBe('<root id="8"/>')
  })

  it('keeps dynamic XML item bindings isolated between calls', () => {
    const template = {
      $id: 'urn:template',
      $defs: { item: { $dynamicAnchor: 'item', not: {} } },
      type: 'object',
      properties: {
        items: { type: 'array', items: { $dynamicRef: '#item' } },
      },
    }
    const bind = (name: string, attribute: boolean) =>
      schema({
        '$ref': 'urn:template',
        '$ref-value': template,
        $id: `urn:${name}`,
        xml: { name: 'root' },
        $defs: {
          item: {
            $dynamicAnchor: 'item',
            type: 'object',
            xml: { name },
            properties: { id: { example: 7, xml: { attribute } } },
          },
        },
      })
    const first = bind('person', true)
    const second = bind('group', false)
    expect(getXmlExampleFromSchema(first, compact).xml).toBe('<root><person id="7"/></root>')
    expect(getXmlExampleFromSchema(second, compact).xml).toBe('<root><group><id>7</id></group></root>')
    expect(getXmlExampleFromSchema(first, compact).xml).toBe('<root><person id="7"/></root>')
  })

  it('preserves numeric property names when their XML names are valid', () => {
    const input = schema({ xml: { name: 'root' }, properties: { '0': { example: 'zero', xml: { name: 'zero' } } } })
    expect(getXmlExampleFromSchema(input, compact)).toStrictEqual({
      xml: '<root><zero>zero</zero></root>',
      diagnostics: [],
    })
  })

  it('keeps generated variables, precedence, and omission consistent with JSON', () => {
    const input = schema({
      xml: { name: 'root' },
      type: 'object',
      properties: {
        id: { type: 'integer', 'x-variable': 'id', xml: { attribute: true }, example: 2 },
        value: { type: 'string', examples: ['first'], example: 'second', default: 'third', const: 'fourth' },
        optional: { type: 'string' },
      },
    })
    const options = { ...compact, variables: { id: '9' }, omitEmptyAndOptionalProperties: true }
    expect(getXmlExampleFromSchema(input, options).xml).toBe('<root id="9"><value>first</value></root>')
    expect(getExampleFromSchema(input, options)).toStrictEqual({ id: 9, value: 'first' })
  })
  it('uses pattern property XML metadata for supplied data', () => {
    expect(
      serializeXmlExample(
        { code_a: 'a', code_b: 'b' },
        schema({
          xml: { name: 'root' },
          patternProperties: { '^code_': { type: 'string', xml: { name: 'code' } } },
        }),
        compact,
      ),
    ).toStrictEqual({ xml: '<root><code>a</code><code>b</code></root>', diagnostics: [] })
  })

  it('reports unresolved references instead of inventing their XML structure', () => {
    const result = serializeXmlExample({ id: 7 }, schema({ $ref: '#/components/schemas/Missing' }), compact)
    expect(result.xml).toBeUndefined()
    expect(result.diagnostics.map(({ code }) => code)).toStrictEqual(['unresolved-reference'])
  })
  it('preserves item annotations beside a selected array composition', () => {
    const input = schema({
      xml: { name: 'root' },
      properties: {
        things: {
          type: 'array',
          items: {
            xml: { name: 'item', prefix: 'p', namespace: 'urn:item' },
            oneOf: [{ type: 'string', example: 'a' }],
          },
        },
      },
    })
    const expected = '<root><p:item xmlns:p="urn:item">a</p:item></root>'
    expect(getXmlExampleFromSchema(input, compact).xml).toBe(expected)
    expect(serializeXmlExample({ things: ['a'] }, input, compact).xml).toBe(expected)
  })

  it('reports unresolved generated references at roots and properties', () => {
    for (const input of [
      schema({ $ref: '#/components/schemas/Missing' }),
      schema({ xml: { name: 'root' }, properties: { missing: { $ref: '#/components/schemas/Missing' } } }),
    ]) {
      const result = getXmlExampleFromSchema(input, compact)
      expect(result.xml).toBeUndefined()
      expect(result.diagnostics.map(({ code }) => code)).toStrictEqual(['unresolved-reference'])
    }
  })

  it('reports unsupported property patterns without evaluating them', () => {
    const result = serializeXmlExample(
      { ['a'.repeat(24) + '!']: 'value' },
      schema({ xml: { name: 'root' }, patternProperties: { '^(a+)+$': { xml: { name: 'value' } } } }),
      compact,
    )
    expect(result.xml).toBeUndefined()
    expect(result.diagnostics.map(({ code }) => code)).toStrictEqual(['unsupported-pattern'])
  })
  it.each(['oneOf', 'anyOf', 'allOf'] as const)('retains reference node layers through %s', (keyword) => {
    const reference = {
      $ref: '#/components/schemas/Person',
      '$ref-value': {
        type: 'object',
        xml: { name: 'person', nodeType: 'element' },
        properties: { id: { type: 'integer', example: 42 } },
      },
      xml: { name: 'envelope', nodeType: 'element' },
    }
    const input = schema({ [keyword]: [reference] })
    const options = { ...compact, openapiVersion: '3.2.0' }
    const expected = '<envelope><person><id>42</id></person></envelope>'
    expect(getXmlExampleFromSchema(input, options)).toStrictEqual({ xml: expected, diagnostics: [] })
    expect(serializeXmlExample({ id: 42 }, input, options)).toStrictEqual({ xml: expected, diagnostics: [] })
  })
  it.each(['oneOf', 'anyOf', 'allOf'] as const)('reports unresolved generated references inside %s', (keyword) => {
    const result = getXmlExampleFromSchema(schema({ [keyword]: [{ $ref: '#/components/schemas/Missing' }] }), compact)
    expect(result.xml).toBeUndefined()
    expect(result.diagnostics.filter(({ severity }) => severity === 'error').map(({ code }) => code)).toStrictEqual([
      'unresolved-reference',
    ])
  })
})
