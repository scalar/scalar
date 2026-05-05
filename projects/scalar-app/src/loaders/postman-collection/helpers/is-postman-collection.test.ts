import { describe, expect, it } from 'vitest'

import { isPostmanCollection } from './is-postman-collection'

describe('isPostmanCollection', () => {
  it('returns false for empty string', () => {
    const result = isPostmanCollection('')
    expect(result).toBe(false)
  })

  it('returns false for invalid JSON', () => {
    const result = isPostmanCollection('not valid json')
    expect(result).toBe(false)
  })

  it('returns false for malformed JSON with syntax errors', () => {
    const result = isPostmanCollection('{"info": {"_postman_id": "abc",}}')
    expect(result).toBe(false)
  })

  it('returns false for valid JSON but not a Postman collection', () => {
    const content = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'My API',
        version: '1.0.0',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('returns false when missing _postman_id', () => {
    const content = JSON.stringify({
      info: {
        name: 'Test Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('returns false when _postman_id is undefined', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: undefined,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('returns falsy when missing schema', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'Test Collection',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBeFalsy()
  })

  it('returns falsy when schema is empty string', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: '',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBeFalsy()
  })

  it('returns falsy when schema is null', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: null,
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBeFalsy()
  })

  it('returns false when schema has wrong host', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: 'https://example.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('returns false when schema is not a valid URL', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: 'not-a-valid-url',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('returns false when info object is missing', () => {
    const content = JSON.stringify({
      _postman_id: 'abc123',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('returns false when info is null', () => {
    const content = JSON.stringify({
      info: null,
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('returns true for valid Postman v2.1 collection', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'Test Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('returns true for valid Postman v2.0 collection', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'xyz789',
        name: 'Legacy Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('returns true for Postman collection with minimal required fields', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'minimal123',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('returns true for Postman collection with additional fields', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'complex123',
        name: 'Complex Collection',
        description: 'A test collection',
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        author: 'Test User',
      },
      item: [
        {
          name: 'Request 1',
          request: {
            method: 'GET',
            url: 'https://api.example.com',
          },
        },
      ],
      variable: [],
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('accepts _postman_id with empty string value', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: '',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('accepts _postman_id with any truthy value', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 12345,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('returns true for schema with http protocol', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: 'http://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('returns true for schema with different path', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: 'https://schema.getpostman.com/custom/path/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('returns true for schema with query parameters', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json?version=latest',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('returns false for schema with subdomain variation', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: 'https://api.schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('returns false for schema with similar domain', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: 'https://schema.getpostman.co/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('handles collection with deeply nested structure', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'nested123',
        name: 'Nested Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Folder 1',
          item: [
            {
              name: 'Subfolder 1',
              item: [
                {
                  name: 'Request 1',
                  request: {
                    method: 'GET',
                    url: 'https://api.example.com',
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('returns false for whitespace-only string', () => {
    const result = isPostmanCollection('   ')
    expect(result).toBe(false)
  })

  it('returns false for JSON array', () => {
    const content = JSON.stringify([
      {
        info: {
          _postman_id: 'abc123',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
      },
    ])

    const result = isPostmanCollection(content)
    expect(result).toBe(false)
  })

  it('accepts _postman_id as false (defined value)', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: false,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('accepts _postman_id as 0 (defined value)', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 0,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })

  it('handles large JSON content efficiently', () => {
    const largeItems = Array.from({ length: 1000 }, (_, i) => ({
      name: `Request ${i}`,
      request: {
        method: 'GET',
        url: `https://api.example.com/${i}`,
      },
    }))

    const content = JSON.stringify({
      info: {
        _postman_id: 'large123',
        name: 'Large Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: largeItems,
    })

    const result = isPostmanCollection(content)
    expect(result).toBe(true)
  })
})
