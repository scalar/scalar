import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { assert, describe, expect, it } from 'vitest'

import { getOperationFromCurl } from './get-operation-from-curl'

describe('get-operation-from-curl', () => {
  it('parses simple GET request', () => {
    const curl = 'curl http://example.com/api/users'
    const result = getOperationFromCurl(curl)

    expect(result.path).toBe('/api/users')
    expect(result.method).toBe('get')
    expect(result.operation.parameters).toEqual([])
  })

  it('parses POST request with JSON body', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"name":"John","age":30}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(result.path).toBe('/api/users')
    expect(result.method).toBe('post')
    expect(requestBody?.content).toHaveProperty('application/json')

    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'type' in schema)
    assert(schema.type === 'object')
    expect(schema.type).toBe('object')
    expect(schema.properties?.name).toEqual({ type: 'string' })
    expect(schema.properties?.age).toEqual({ type: 'number' })
  })

  it('parses POST request with form-encoded body', () => {
    const curl = 'curl -X POST http://example.com/api/users -d "name=John&age=30"'
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(result.path).toBe('/api/users')
    expect(result.method).toBe('post')
    expect(requestBody?.content).toHaveProperty('application/x-www-form-urlencoded')

    const schema = getResolvedRef(requestBody?.content['application/x-www-form-urlencoded']?.schema)

    assert(schema && 'type' in schema)
    assert(schema.type === 'object')
    expect(schema.type).toBe('object')
    expect(schema.properties?.name).toEqual({ type: 'string' })
    expect(schema.properties?.age).toEqual({ type: 'string' })
  })

  it('parses request with query parameters', () => {
    const curl = 'curl "http://example.com/api/users?limit=10"'
    const result = getOperationFromCurl(curl)

    expect(result.path).toBe('/api/users')
    expect(result.operation.parameters).toHaveLength(1)

    const limitParam = getResolvedRef(result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'limit'))
    assert(limitParam && 'schema' in limitParam)
    const limitSchema = getResolvedRef(limitParam.schema)
    assert(limitSchema && 'type' in limitSchema)
    const limitExample = getResolvedRef(limitParam.examples?.curl)

    expect(limitParam.in).toBe('query')
    expect(limitSchema.type).toBe('string')
    expect(limitExample?.value).toBe('10')
  })

  it('parses request with headers', () => {
    const curl =
      'curl http://example.com/api/users -H "Authorization: Bearer token123" -H "Content-Type: application/json"'
    const result = getOperationFromCurl(curl)

    expect(result.operation.parameters).toHaveLength(2)

    const authParam = getResolvedRef(
      result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'Authorization'),
    )
    assert(authParam && 'schema' in authParam)
    const authSchema = getResolvedRef(authParam.schema)
    assert(authSchema && 'type' in authSchema)
    const authExample = getResolvedRef(authParam.examples?.curl)

    expect(authParam.in).toBe('header')
    expect(authSchema.type).toBe('string')
    expect(authExample?.value).toBe('Bearer token123')

    const contentTypeParam = getResolvedRef(
      result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'Content-Type'),
    )
    assert(contentTypeParam && 'schema' in contentTypeParam)
    const contentTypeSchema = getResolvedRef(contentTypeParam.schema)
    assert(contentTypeSchema && 'type' in contentTypeSchema)
    const contentTypeExample = getResolvedRef(contentTypeParam.examples?.curl)

    expect(contentTypeParam.in).toBe('header')
    expect(contentTypeSchema.type).toBe('string')
    expect(contentTypeExample?.value).toBe('application/json')
  })

  it('parses request with both query parameters and headers', () => {
    const curl = 'curl http://example.com/api/users?limit=10 -H "Authorization: Bearer token"'
    const result = getOperationFromCurl(curl)

    expect(result.operation.parameters).toHaveLength(2)

    const queryParam = getResolvedRef(result.operation.parameters?.find((p) => getResolvedRef(p)?.in === 'query'))
    expect(queryParam?.name).toBe('limit')

    const headerParam = getResolvedRef(result.operation.parameters?.find((p) => getResolvedRef(p)?.in === 'header'))
    expect(headerParam?.name).toBe('Authorization')
  })

  it('parses request with custom example key', () => {
    const curl = 'curl http://example.com/api/users?limit=10'
    const result = getOperationFromCurl(curl, 'custom-example')

    const limitParam = getResolvedRef(result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'limit'))
    assert(limitParam && 'examples' in limitParam)
    const customExample = getResolvedRef(limitParam.examples?.['custom-example'])

    expect(limitParam.examples).toHaveProperty('custom-example')
    expect(customExample?.value).toBe('10')
  })

  it('detects JSON content type from JSON body with explicit header', () => {
    const curl = 'curl -X POST http://example.com/api/users -H "Content-Type: application/json" -d \'{"name":"John"}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(requestBody?.content).toHaveProperty('application/json')
  })

  it('auto-detects JSON content type from JSON body without header', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"name":"John"}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(requestBody?.content).toHaveProperty('application/json')
  })

  it('auto-detects JSON content type from JSON array without header', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'[{"name":"John"},{"name":"Jane"}]\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(requestBody?.content).toHaveProperty('application/json')
  })

  it('detects form-encoded content type from body without Content-Type header', () => {
    const curl = 'curl -X POST http://example.com/api/users -d "name=John&age=30"'
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(requestBody?.content).toHaveProperty('application/x-www-form-urlencoded')
  })

  it('infers string type for string values', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"name":"John"}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.name).toEqual({ type: 'string' })
  })

  it('infers number type for numeric values', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"age":30}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.age).toEqual({ type: 'number' })
  })

  it('infers boolean type for boolean values', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"active":true}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.active).toEqual({ type: 'boolean' })
  })

  it('infers null type for null values', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"deletedAt":null}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.deletedAt).toEqual({ type: 'null' })
  })

  it('infers array type for array values', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"tags":["tag1","tag2"]}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.tags).toEqual({ type: 'array' })
  })

  it('infers object type for nested object values', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"address":{"city":"NYC"}}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.address).toEqual({ type: 'object' })
  })

  it('handles empty body', () => {
    const curl = 'curl http://example.com/api/users'
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    expect(requestBody?.content['']).toBeDefined()
  })

  it('parses URL with special characters', () => {
    const curl = 'curl "http://example.com/api/users/john@example.com"'
    const result = getOperationFromCurl(curl)

    expect(result.path).toBe('/api/users/john@example.com')
  })

  it('parses URL with encoded spaces', () => {
    const curl = 'curl "http://example.com/api/users/john%20doe"'
    const result = getOperationFromCurl(curl)

    expect(result.path).toBe('/api/users/john%20doe')
  })

  it('handles form-encoded data with URL encoding', () => {
    const curl = 'curl -X POST http://example.com/api/users -d "name=John%20Doe&email=john%40example.com"'
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const curlExample = getResolvedRef(requestBody?.content['application/x-www-form-urlencoded']?.examples?.curl)

    expect(curlExample?.value).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
    })
  })

  it('handles form-encoded data with missing values', () => {
    const curl = 'curl -X POST http://example.com/api/users -d "name=John&age="'
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const curlExample = getResolvedRef(requestBody?.content['application/x-www-form-urlencoded']?.examples?.curl)

    expect(curlExample?.value).toEqual({
      name: 'John',
    })
  })

  it('handles form-encoded data with malformed pairs', () => {
    const curl = 'curl -X POST http://example.com/api/users -d "name=John&invalidpair&age=30"'
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const curlExample = getResolvedRef(requestBody?.content['application/x-www-form-urlencoded']?.examples?.curl)

    expect(curlExample?.value).toEqual({
      name: 'John',
      age: '30',
    })
  })

  it('preserves example values in request body', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"name":"John","age":30}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const curlExample = getResolvedRef(requestBody?.content['application/json']?.examples?.curl)

    expect(curlExample?.value).toEqual({
      name: 'John',
      age: 30,
    })
  })

  it('sets selected content type in request body metadata', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"name":"John"}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const selectedContentType = requestBody?.['x-scalar-selected-content-type']

    expect(selectedContentType?.curl).toBe('application/json')
  })

  it('handles multiple headers with same example key', () => {
    const curl = 'curl http://example.com/api/users -H "X-API-Key: key1" -H "X-Request-ID: req123"'
    const result = getOperationFromCurl(curl)

    const apiKeyParam = getResolvedRef(
      result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'X-API-Key'),
    )
    assert(apiKeyParam && 'examples' in apiKeyParam)
    const apiKeyExample = getResolvedRef(apiKeyParam.examples?.curl)

    const requestIdParam = getResolvedRef(
      result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'X-Request-ID'),
    )
    assert(requestIdParam && 'examples' in requestIdParam)
    const requestIdExample = getResolvedRef(requestIdParam.examples?.curl)

    expect(apiKeyExample?.value).toBe('key1')
    expect(requestIdExample?.value).toBe('req123')
  })

  it('handles complex JSON structures', () => {
    const curl =
      'curl -X POST http://example.com/api/users -d \'{"user":{"name":"John","contacts":[{"type":"email","value":"john@example.com"}]}}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'type' in schema)
    assert(schema.type === 'object')
    expect(schema.type).toBe('object')
    expect(schema.properties?.user).toEqual({ type: 'object' })
  })

  it('handles empty query parameters', () => {
    const curl = 'curl http://example.com/api/users?'
    const result = getOperationFromCurl(curl)

    expect(result.path).toBe('/api/users')
    expect(result.operation.parameters).toEqual([])
  })

  it('uses default example key when not provided', () => {
    const curl = 'curl http://example.com/api/users?limit=10'
    const result = getOperationFromCurl(curl)

    const limitParam = getResolvedRef(result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'limit'))
    assert(limitParam && 'examples' in limitParam)
    expect(limitParam.examples).toHaveProperty('curl')
  })

  it('handles path with trailing slash', () => {
    const curl = 'curl http://example.com/api/users/'
    const result = getOperationFromCurl(curl)

    expect(result.path).toBe('/api/users/')
  })

  it('handles root path', () => {
    const curl = 'curl http://example.com/'
    const result = getOperationFromCurl(curl)

    expect(result.path).toBe('/')
  })

  it('handles path without leading slash', () => {
    const curl = 'curl http://example.com'
    const result = getOperationFromCurl(curl)

    expect(result.path).toBe('/')
  })

  it('handles PUT request', () => {
    const curl = 'curl -X PUT http://example.com/api/users/1 -d \'{"name":"Jane"}\''
    const result = getOperationFromCurl(curl)

    expect(result.method).toBe('put')
    expect(result.path).toBe('/api/users/1')
  })

  it('handles DELETE request', () => {
    const curl = 'curl -X DELETE http://example.com/api/users/1'
    const result = getOperationFromCurl(curl)

    expect(result.method).toBe('delete')
    expect(result.path).toBe('/api/users/1')
  })

  it('handles PATCH request', () => {
    const curl = 'curl -X PATCH http://example.com/api/users/1 -d \'{"name":"Jane"}\''
    const result = getOperationFromCurl(curl)

    expect(result.method).toBe('patch')
    expect(result.path).toBe('/api/users/1')
  })

  it('handles HEAD request', () => {
    const curl = 'curl -X HEAD http://example.com/api/users'
    const result = getOperationFromCurl(curl)

    expect(result.method).toBe('head')
  })

  it('handles OPTIONS request', () => {
    const curl = 'curl -X OPTIONS http://example.com/api/users'
    const result = getOperationFromCurl(curl)

    expect(result.method).toBe('options')
  })

  it('handles numeric query parameter values', () => {
    const curl = 'curl http://example.com/api/users?age=30'
    const result = getOperationFromCurl(curl)

    const ageParam = getResolvedRef(result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'age'))
    assert(ageParam && 'schema' in ageParam)
    const ageSchema = getResolvedRef(ageParam.schema)
    assert(ageSchema && 'type' in ageSchema)

    expect(ageSchema.type).toBe('string')
  })

  it('handles boolean-like query parameter values', () => {
    const curl = 'curl http://example.com/api/users?active=true'
    const result = getOperationFromCurl(curl)

    const activeParam = getResolvedRef(result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'active'))
    assert(activeParam && 'schema' in activeParam)
    const activeSchema = getResolvedRef(activeParam.schema)
    assert(activeSchema && 'type' in activeSchema)

    expect(activeSchema.type).toBe('string')
  })

  it('creates proper schema for empty object body', () => {
    const curl = "curl -X POST http://example.com/api/users -d '{}'"
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'type' in schema)
    assert(schema.type === 'object')
    expect(schema.type).toBe('object')
    expect(schema.properties).toEqual({})
  })

  it('handles deeply nested JSON structures', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"level1":{"level2":{"level3":{"value":"deep"}}}}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'type' in schema)
    assert(schema.type === 'object')
    expect(schema.type).toBe('object')
    expect(schema.properties?.level1).toEqual({ type: 'object' })
  })

  it('handles mixed type arrays in JSON', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"mixed":[1,"two",true,null]}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.mixed).toEqual({ type: 'array' })
  })

  it('handles special characters in header values', () => {
    const curl = 'curl http://example.com/api/users -H "X-Custom: value!@#$%^&*()"'
    const result = getOperationFromCurl(curl)

    const customParam = getResolvedRef(result.operation.parameters?.find((p) => getResolvedRef(p)?.name === 'X-Custom'))
    assert(customParam && 'examples' in customParam)
    const customExample = getResolvedRef(customParam.examples?.curl)

    expect(customExample?.value).toBe('value!@#$%^&*()')
  })

  it('handles unicode characters in JSON body', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"name":"用户","emoji":"🚀"}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const curlExample = getResolvedRef(requestBody?.content['application/json']?.examples?.curl)

    expect(curlExample?.value).toEqual({
      name: '用户',
      emoji: '🚀',
    })
  })

  it('handles empty string values in JSON', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"name":"","age":30}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.name).toEqual({ type: 'string' })
  })

  it('handles zero values in JSON', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"count":0}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.count).toEqual({ type: 'number' })

    const curlExample = getResolvedRef(requestBody?.content['application/json']?.examples?.curl)
    expect(curlExample?.value?.count).toBe(0)
  })

  it('handles false values in JSON', () => {
    const curl = 'curl -X POST http://example.com/api/users -d \'{"active":false}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const schema = getResolvedRef(requestBody?.content['application/json']?.schema)

    assert(schema && 'properties' in schema)
    expect(schema.properties?.active).toEqual({ type: 'boolean' })

    const curlExample = getResolvedRef(requestBody?.content['application/json']?.examples?.curl)
    expect(curlExample?.value?.active).toBe(false)
  })

  it('handles Content-Type header with charset', () => {
    const curl =
      'curl -X POST http://example.com/api/users -H "Content-Type: application/json; charset=utf-8" -d \'{"name":"John"}\''
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(requestBody?.content).toHaveProperty('application/json; charset=utf-8')
  })

  it('handles multiple query parameters with same name', () => {
    const curl = 'curl "http://example.com/api/users?tag=red&tag=blue"'
    const result = getOperationFromCurl(curl)

    const tagParams = result.operation.parameters?.filter((p) => getResolvedRef(p)?.name === 'tag')
    // Note: parseCurlCommand may only keep the last value when there are duplicate keys
    expect(tagParams?.length).toBeGreaterThanOrEqual(1)
  })
})
