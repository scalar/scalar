import { describe, expect, it } from 'vitest'

import { normalize } from '@/helpers/normalize'

/**
 * Build a YAML document shaped like an AWS API Gateway export: shared pieces live under
 * `x-definitions` as anchors (some containing further aliases) and every operation merges them in.
 * With yaml 2.9.1 each merge counts toward `maxAliasCount`, so 200 operations need about 16,000.
 */
const createApiGatewayExport = (operationCount: number): string => {
  const codes = [400, 401, 403, 404, 500, 501, 502, 504]
  const errorResponses = codes.map((code) => `    '${code}':\n      description: Error ${code}`).join('\n')
  const integrationResponses = codes
    .map((code) => `      '${code}':\n        <<: *error-response\n        statusCode: ${code}`)
    .join('\n')
  const operations = Array.from(
    { length: operationCount },
    (_, index) => `  /operation-${index}:
    get:
      responses:
        <<: *error-responses
        '200':
          description: OK
      x-amazon-apigateway-integration:
        <<: *base-integration
        uri: operation-${index}`,
  ).join('\n')

  return `openapi: 3.1.0
info:
  title: API Gateway export
  version: 1.0.0
x-definitions:
  cors-headers: &cors-headers
    method.response.header.Access-Control-Allow-Origin: "'*'"
  error-responses: &error-responses
${errorResponses}
  base-integration: &base-integration
    type: aws
    responses:
      default: &error-response
        statusCode: 200
        responseParameters: *cors-headers
${integrationResponses}
paths:
${operations}
`
}

/** Build a "billion laughs" document: every level references the previous one ten times. */
const createBillionLaughs = (depth: number): string => {
  const levels = Array.from(
    { length: depth },
    (_, index) => `l${index + 1}: &l${index + 1} [${Array(10).fill(`*l${index}`).join(', ')}]`,
  )
  return ['l0: &l0 lol', ...levels].join('\n')
}

describe('normalize', () => {
  it('returns undefined if the document is null', () => {
    expect(normalize(null)).toEqual(undefined)
  })

  it('parses JSON string specifications', () => {
    const jsonString = '{"foo": "bar"}'
    expect(normalize(jsonString)).toEqual({ foo: 'bar' })
  })

  it('parses JSON with a leading UTF-8 BOM', () => {
    const jsonWithBom = `\uFEFF${JSON.stringify({ foo: 'bar' })}`
    expect(normalize(jsonWithBom)).toEqual({ foo: 'bar' })
  })

  it('should parse YAML string specifications', () => {
    const yamlString = 'foo: bar\nbar: foo'
    expect(normalize(yamlString)).toEqual({ foo: 'bar', bar: 'foo' })
  })

  it('should handle invalid YAML with custom maxAliasCount', () => {
    const yamlString = `
      aliases: &ref
        - item1
        - item2
      items: *ref
    `
    expect(() => normalize(yamlString)).not.toThrow()
  })

  it('parses documents that merge shared anchors into many operations', () => {
    const result = normalize(createApiGatewayExport(200)) as {
      paths: Record<string, { get: Record<string, unknown> }>
    }

    expect(Object.keys(result.paths)).toHaveLength(200)
    expect(result.paths['/operation-199']?.get['x-amazon-apigateway-integration']).toMatchObject({
      type: 'aws',
      uri: 'operation-199',
      responses: {
        '404': { statusCode: 404, responseParameters: { 'method.response.header.Access-Control-Allow-Origin': "'*'" } },
      },
    })
    expect(result.paths['/operation-0']?.get.responses).toHaveProperty('504.description', 'Error 504')
  })

  it('rejects exponentially expanding aliases past the alias limit', () => {
    // Four levels need a `maxAliasCount` of 14,641 and five levels need 161,051.
    expect(normalize(createBillionLaughs(4))).toHaveProperty('l4')
    expect(() => normalize(createBillionLaughs(5))).toThrow('Excessive alias count')
  })

  it('should return the same object if specification is already an object', () => {
    const obj = { foo: 'bar' }
    expect(normalize(obj)).toBe(obj)
  })

  it("doesn't freak out on invalid JSON strings ", () => {
    // Missing quotes around property name
    const malformedJson = '{ foo: "bar" }'
    expect(normalize(malformedJson)).toEqual(undefined)
  })

  it('should handle empty string input', () => {
    expect(normalize('')).toEqual(undefined)
  })

  it('should handle whitespace-only string input', () => {
    expect(normalize('   ')).toEqual(undefined)
  })

  it('should handle complex nested structures', () => {
    const complex = {
      nested: {
        array: [1, 2, 3],
        object: {
          foo: 'bar',
        },
      },
    }
    expect(normalize(complex)).toEqual(complex)
  })

  it('should handle invalid JSON and YAML strings gracefully', () => {
    const invalidString = 'not a valid json or yaml'
    expect(() => normalize(invalidString)).not.toThrow()
  })

  it('should handle non-string, non-object inputs', () => {
    expect(normalize(42)).toEqual(42)
    expect(normalize(true)).toEqual(true)
    expect(normalize([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('should handle deeply nested structures', () => {
    const nested = { a: { b: { c: { d: { e: 'deep' } } } } }
    expect(normalize(nested)).toEqual(nested)
  })

  it('should handle large input strings', () => {
    const largeJson = JSON.stringify({ foo: 'bar'.repeat(10000) })
    expect(normalize(largeJson)).toEqual({ foo: 'bar'.repeat(10000) })
  })

  it('should handle circular references', () => {
    const circularObj: any = {}
    circularObj.self = circularObj
    expect(() => normalize(circularObj)).not.toThrow()
  })

  it('should handle special characters in strings', () => {
    const specialCharJson = '{"foo": "bar\\n"}'
    expect(normalize(specialCharJson)).toEqual({ foo: 'bar\n' })
  })
})
