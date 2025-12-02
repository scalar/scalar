import { describe, expect, it } from 'vitest'

import { getPostmanDocumentDetails } from './get-postman-document-details'

describe('getPostmanDocumentDetails', () => {
  it('returns null for empty string', () => {
    const result = getPostmanDocumentDetails('')
    expect(result).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    const result = getPostmanDocumentDetails('not valid json')
    expect(result).toBeNull()
  })

  it('returns null for valid JSON but not a Postman collection', () => {
    const content = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'My API',
        version: '1.0.0',
      },
    })

    const result = getPostmanDocumentDetails(content)
    expect(result).toBeNull()
  })

  it('returns null for JSON without _postman_id', () => {
    const content = JSON.stringify({
      info: {
        name: 'Test Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)
    expect(result).toBeNull()
  })

  it('returns null for JSON without valid schema', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'Test Collection',
      },
    })

    const result = getPostmanDocumentDetails(content)
    expect(result).toBeNull()
  })

  it('parses valid Postman v2.1 collection with all fields', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'My API Collection',
        version: '2.1.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'My API Collection',
      version: '2.1.0',
    })
  })

  it('parses valid Postman v2.0 collection', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'xyz789',
        name: 'Legacy Collection',
        version: '2.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Legacy Collection',
      version: '2.0.0',
    })
  })

  it('uses default title when name is missing', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        version: '1.5.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Postman Collection',
      version: '1.5.0',
    })
  })

  it('uses default version when version is missing', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'Test Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Test Collection',
      version: '1.0',
    })
  })

  it('uses defaults when both name and version are missing', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Postman Collection',
      version: '1.0',
    })
  })

  it('handles empty name gracefully', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: '',
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Postman Collection',
      version: '1.0.0',
    })
  })

  it('handles empty version gracefully', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'Test Collection',
        version: '',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Test Collection',
      version: '1.0',
    })
  })

  it('handles collection with special characters in name', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'My API™ Collection 🚀',
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'My API™ Collection 🚀',
      version: '1.0.0',
    })
  })

  it('handles collection with numeric version', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'Test Collection',
        version: 2.5,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Test Collection',
      version: 2.5,
    })
  })

  it('handles collection with extra whitespace in name', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: '  Test Collection  ',
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: '  Test Collection  ',
      version: '1.0.0',
    })
  })

  it('returns null for malformed JSON with trailing comma', () => {
    const content = '{"info": {"_postman_id": "abc123",}}'

    const result = getPostmanDocumentDetails(content)
    expect(result).toBeNull()
  })

  it('handles large collection names', () => {
    const longName = 'A'.repeat(500)
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: longName,
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: longName,
      version: '1.0.0',
    })
  })

  it('handles collection with complex nested structure', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'Complex Collection',
        version: '3.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: 'A complex collection with many fields',
        author: 'Test Author',
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
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Complex Collection',
      version: '3.0.0',
    })
  })

  it('always returns json as type', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: 'Type Test',
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result?.type).toBe('json')
  })

  it('handles null info fields gracefully', () => {
    const content = JSON.stringify({
      info: {
        _postman_id: 'abc123',
        name: null,
        version: null,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
    })

    const result = getPostmanDocumentDetails(content)

    expect(result).toEqual({
      type: 'json',
      title: 'Postman Collection',
      version: '1.0',
    })
  })

  it('handles undefined info object', () => {
    const content = JSON.stringify({
      _postman_id: 'abc123',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    })

    const result = getPostmanDocumentDetails(content)
    expect(result).toBeNull()
  })
})
