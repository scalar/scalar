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

  it.each([`-A '-XPOST'`, `-sA '-XPOST'`, `--user-agent '-XPOST'`, `--proxy 'https://proxy.example.com'`])(
    'imports GET after consuming ignored option %s',
    (options) => {
      const result = getOperationFromCurl(`curl ${options} https://example.com/users`)
      expect(result.method).toBe('get')
      expect(result.path).toBe('/users')
      expect(result.operation.parameters).toStrictEqual([])
      expect(result.operation.servers).toStrictEqual([{ url: 'https://example.com' }])
    },
  )

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

  it('handles form-encoded data with explicitly empty values', () => {
    const curl = 'curl -X POST http://example.com/api/users -d "name=John&age="'
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const curlExample = getResolvedRef(requestBody?.content['application/x-www-form-urlencoded']?.examples?.curl)

    expect(curlExample?.value).toEqual({
      name: 'John',
      age: '',
    })
  })

  it.each([
    ['equal signs in a value', 'token=YWJjZA==&next=/a?b=c', { token: 'YWJjZA==', next: '/a?b=c' }],
    ['a plus sign as a space', 'q=hello+world&phone=%2B49', { q: 'hello world', phone: '+49' }],
    ['a bare percent sign', 'discount=50%&name=John', { discount: '50%', name: 'John' }],
  ])('handles form-encoded data with %s', (_, body, value) => {
    const result = getOperationFromCurl(`curl -X POST https://api.example.com/forms -d '${body}'`)

    const requestBody = getResolvedRef(result.operation.requestBody)
    const content = requestBody?.content['application/x-www-form-urlencoded']
    expect(getResolvedRef(content?.examples?.curl)?.value).toStrictEqual(value)
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

  it.each([
    [
      '--data-raw',
      `curl 'https://api.example.com/v1/users' -H 'content-type: application/json' --data-raw '{"name":"Ada","age":36}'`,
    ],
    [
      '-d before the URL',
      `curl -H 'Content-Type: application/json' -d '{"name":"Ada","age":36}' https://api.example.com/v1/users`,
    ],
    [
      '--data-binary',
      `curl https://api.example.com/v1/users -H 'Content-Type: application/json' --data-binary '{"name":"Ada","age":36}'`,
    ],
  ])('imports a request with %s and no method flag as a POST with the body', (_, curl) => {
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(result.method).toBe('post')
    expect(result.path).toBe('/v1/users')
    expect(requestBody?.content['application/json']?.examples).toStrictEqual({
      curl: { value: { name: 'Ada', age: 36 } },
    })
    expect(result.operation.parameters?.map((parameter) => getResolvedRef(parameter)?.in)).not.toContain('query')
  })

  it('imports form data before the URL as body fields without query parameters', () => {
    const result = getOperationFromCurl('curl -X POST -d "user=ada&pass=x" https://api.example.com/login')

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(result.method).toBe('post')
    expect(result.operation.parameters).toStrictEqual([])
    expect(requestBody?.content['application/x-www-form-urlencoded']?.examples).toStrictEqual({
      curl: { value: { user: 'ada', pass: 'x' } },
    })
  })

  it('imports -G data as query parameters of a GET', () => {
    const result = getOperationFromCurl('curl -G -d "q=ada" -d "limit=10" https://api.example.com/search')

    expect(result.method).toBe('get')
    expect(result.operation.parameters?.map((parameter) => getResolvedRef(parameter)?.name)).toStrictEqual([
      'q',
      'limit',
    ])
  })

  it('keeps an explicit method when data is sent', () => {
    const result = getOperationFromCurl(`curl -X PUT https://api.example.com/v1/users/1 -d '{"name":"Ada"}'`)

    expect(result.method).toBe('put')
  })

  it('imports --json as a JSON body of a POST', () => {
    const result = getOperationFromCurl(`curl --json '{"name":"Ada","age":36}' https://api.example.com/v1/users`)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(result.method).toBe('post')
    expect(requestBody?.content['application/json']?.examples).toStrictEqual({
      curl: { value: { name: 'Ada', age: 36 } },
    })
    expect(result.operation.parameters?.map((parameter) => getResolvedRef(parameter)?.name)).toStrictEqual([
      'Content-Type',
      'Accept',
    ])
  })

  it('imports a bundled -sG command as a GET with query parameters', () => {
    const result = getOperationFromCurl('curl -sG -d "q=ada" https://api.example.com/search')

    expect(result.method).toBe('get')
    expect(result.operation.parameters?.map((parameter) => getResolvedRef(parameter)?.name)).toStrictEqual(['q'])
  })

  it('imports an attached -XPOST with data', () => {
    const result = getOperationFromCurl(`curl -XPOST -d '{"name":"Ada"}' https://api.example.com/v1/users`)

    expect(result.method).toBe('post')
    expect(result.path).toBe('/v1/users')
  })

  it('imports empty data as a POST to the URL', () => {
    const result = getOperationFromCurl(`curl -d '' https://api.example.com/v1/users`)

    expect(result.method).toBe('post')
    expect(result.path).toBe('/v1/users')
    expect(result.operation.servers).toStrictEqual([{ url: 'https://api.example.com' }])
  })

  it.each([
    ['content-type', 'text/plain'],
    ['CONTENT-TYPE', 'text/plain'],
    ['content-type', 'application/vnd.api+json'],
    ['Content-Type', 'application/vnd.api+json'],
  ])('keeps the %s header %s of the command over the type of the body', (name, contentType) => {
    const result = getOperationFromCurl(
      `curl -H '${name}: ${contentType}' -d '{"name":"Ada"}' https://api.example.com/v1/users`,
    )

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(Object.keys(requestBody?.content ?? {})).toStrictEqual([contentType])
    expect(requestBody?.['x-scalar-selected-content-type']).toStrictEqual({ curl: contentType })
  })

  it.each([
    `curl --url=https://api.example.com/v1/users --data='{"name":"Ada"}'`,
    `curl --json='{"name":"Ada"}' https://api.example.com/v1/users`,
  ])('imports attached long flag values in %s as a POST with the body', (curl) => {
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(result.method).toBe('post')
    expect(result.path).toBe('/v1/users')
    expect(requestBody?.content['application/json']?.examples).toStrictEqual({
      curl: { value: { name: 'Ada' } },
    })
  })

  it('imports --data-urlencode content with an ampersand as one body field', () => {
    const result = getOperationFromCurl(`curl --data-urlencode 'note=a&b' https://api.example.com/v1/notes`)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(requestBody?.content['application/x-www-form-urlencoded']?.examples).toStrictEqual({
      curl: { value: { note: 'a&b' } },
    })
  })

  it.each([
    [
      'Chrome',
      [
        'curl --url ^"https://api.example.com/v1/users^" ^',
        '  -H ^"Content-Type: application/json^" ^',
        `  --data-raw ^"^{^"^"name^"^":^"^"it's^"^"^}^"`,
      ].join('\n'),
    ],
    [
      'Firefox',
      [
        'curl.exe ^"https://api.example.com/v1/users^" ^',
        '  -H ^"Content-Type: application/json^" ^',
        String.raw`  --data-raw ^"^{^\^"name^\^":^\^"it's^\^"^}^"`,
      ].join('\n'),
    ],
  ])('imports a command copied from %s for cmd as a POST with the body', (_browser, curl) => {
    const result = getOperationFromCurl(curl)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(result.method).toBe('post')
    expect(result.path).toBe('/v1/users')
    expect(requestBody?.content['application/json']?.examples).toStrictEqual({
      curl: { value: { name: "it's" } },
    })
  })

  it.each([
    ['', 'post'],
    ['-G', 'post'],
    ['-X PUT', 'put'],
  ])('imports -F fields with %s as a multipart body of a %s', (flag, method) => {
    const result = getOperationFromCurl(`curl ${flag} -F 'name=Ada' -F 'city=Pune' https://api.example.com/v1/users`)

    const requestBody = getResolvedRef(result.operation.requestBody)

    expect(result.method).toBe(method)
    expect(Object.keys(requestBody?.content ?? {})).toStrictEqual(['multipart/form-data'])
    expect(requestBody?.content['multipart/form-data']?.examples).toStrictEqual({
      curl: { value: { name: 'Ada', city: 'Pune' } },
    })
    expect(requestBody?.['x-scalar-selected-content-type']).toStrictEqual({ curl: 'multipart/form-data' })
  })

  it.each([
    [`-F 'name='`, 'name', 'multipart/form-data'],
    [`--form-string 'name='`, 'name', 'multipart/form-data'],
    [`-F 'file=@file.txt'`, 'file', 'multipart/form-data'],
    [`-F 'file=<file.txt'`, 'file', 'multipart/form-data'],
    [`-d 'name='`, 'name', 'application/x-www-form-urlencoded'],
  ])('preserves empty body fields for %s', (options, field, contentType) => {
    const result = getOperationFromCurl(`curl ${options} https://example.com`)
    const requestBody = getResolvedRef(result.operation.requestBody)
    expect(result.method).toBe('post')
    expect(requestBody?.content[contentType]?.examples).toStrictEqual({ curl: { value: { [field]: '' } } })
    expect(requestBody?.content[contentType]?.schema).toStrictEqual({
      type: 'object',
      properties: { [field]: { type: 'string' } },
    })
  })
})
