// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'

import { getXmlExampleFromSchema, serializeXmlExample } from './get-xml-example'

const parse = (xml: string | undefined): Document => {
  expect(typeof xml).toBe('string')
  const document = new DOMParser().parseFromString(xml ?? '', 'application/xml')
  expect(document.querySelector('parsererror')).toBeNull()
  return document
}

describe('xml-roundtrip', () => {
  it('preserves mixed text and attribute values through an independent XML parser', () => {
    const input = {
      type: 'object',
      xml: { name: 'message' },
      properties: {
        id: { type: 'string', xml: { attribute: true, namespace: 'urn:ids', prefix: 'i' } },
        before: { type: 'string', xml: { nodeType: 'text' } },
        name: { type: 'string', xml: { namespace: 'urn:names' } },
        after: { type: 'string', xml: { nodeType: 'cdata' } },
      },
    } as unknown as SchemaObject
    const value = { id: '\n\t\r"&', before: 'Hello\n ', name: 'Ada & Grace', after: ']]>\r!' }
    const document = parse(serializeXmlExample(value, input).xml)
    expect(document.documentElement.getAttributeNS('urn:ids', 'id')).toBe(value.id)
    expect(document.getElementsByTagNameNS('urn:names', 'name')[0]?.textContent).toBe(value.name)
    expect(document.documentElement.textContent).toBe(value.before + value.name + value.after)
  })

  it('maps OpenAPI 3.2 reference wrappers and transparent targets independently', () => {
    const input = {
      $ref: '#/components/schemas/Documentation',
      xml: { nodeType: 'element', name: 'StoredDocument' },
      '$ref-value': {
        type: 'object',
        xml: { nodeType: 'none' },
        properties: {
          content: { type: 'string', example: '<html/>', xml: { nodeType: 'cdata' } },
        },
      },
    } as unknown as SchemaObject
    const document = parse(getXmlExampleFromSchema(input, { openapiVersion: '3.2.0' }).xml)
    expect(document.documentElement.nodeName).toBe('StoredDocument')
    expect(document.documentElement.textContent).toBe('<html/>')
    expect(document.documentElement.children.length).toBe(0)
    expect(document.documentElement.firstChild?.nodeType).toBe(Node.CDATA_SECTION_NODE)
  })

  it('uses the component name for an OpenAPI 3.2 referenced element', () => {
    const input = {
      type: 'object',
      xml: { name: 'root' },
      properties: {
        person: {
          $ref: '#/components/schemas/Person',
          '$ref-value': { type: 'object', properties: { id: { example: 7, xml: { attribute: true } } } },
        },
      },
    } as unknown as SchemaObject
    const document = parse(getXmlExampleFromSchema(input, { openapiVersion: '3.2.0' }).xml)
    expect(document.documentElement.firstElementChild?.nodeName).toBe('Person')
    expect(document.documentElement.firstElementChild?.getAttribute('id')).toBe('7')
  })
})
