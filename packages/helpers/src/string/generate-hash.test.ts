import { describe, expect, it } from 'vitest'

import { generateHash } from './generate-hash'

describe('generateHash', () => {
  it('generates a hash from a simple string', () => {
    const result = generateHash('hello world')

    // Should return a non-empty string
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('produces consistent hashes for the same input', () => {
    const input = 'consistent-test-string'
    const hash1 = generateHash(input)
    const hash2 = generateHash(input)
    const hash3 = generateHash(input)

    // Same input should always produce the same hash
    expect(hash1).toBe(hash2)
    expect(hash2).toBe(hash3)
  })

  it('produces different hashes for different inputs', () => {
    const hash1 = generateHash('first string')
    const hash2 = generateHash('second string')
    const hash3 = generateHash('first strinG') // Case-sensitive

    // Different inputs should produce different hashes
    expect(hash1).not.toBe(hash2)
    expect(hash1).not.toBe(hash3)
    expect(hash2).not.toBe(hash3)
  })

  it('handles empty string', () => {
    const result = generateHash('')

    // Should handle empty strings without throwing
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')

    // Empty string should produce a consistent hash
    const result2 = generateHash('')
    expect(result).toBe(result2)
  })

  it('handles special characters and unicode', () => {
    const inputs = [
      '🚀 emoji test',
      'special chars: !@#$%^&*()',
      'unicode: こんにちは世界',
      'newlines\nand\ttabs',
      'mixed: 👾 special!@# unicode: 你好',
    ]

    const hashes = inputs.map((input) => generateHash(input))

    // All should produce valid hashes
    hashes.forEach((hash) => {
      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
    })

    // All should be unique
    const uniqueHashes = new Set(hashes)
    expect(uniqueHashes.size).toBe(inputs.length)

    // Should be consistent on repeated calls
    const repeatedHash = generateHash('🚀 emoji test')
    expect(repeatedHash).toBe(hashes[0])
  })

  // Create a large OpenAPI-like document to simulate real-world usage
  const largeDocument = JSON.stringify({
    openapi: '3.1.0',
    info: {
      title: 'Large API Specification',
      version: '1.0.0',
      description:
        'This is a large API specification used for testing hash consistency with substantial content. It contains multiple endpoints, schemas, and detailed documentation to ensure the hash function performs well with realistic data volumes.',
      contact: {
        name: 'API Support Team',
        email: 'support@example.com',
        url: 'https://example.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      { url: 'https://api.example.com/v1', description: 'Production server' },
      { url: 'https://staging-api.example.com/v1', description: 'Staging server' },
      { url: 'http://localhost:3000/v1', description: 'Development server' },
    ],
    paths: Array.from({ length: 100 }, (_, i) => ({
      [`/resource-${i}`]: {
        get: {
          operationId: `getResource${i}`,
          summary: `Get resource ${i}`,
          description: `Retrieve detailed information about resource ${i}. This endpoint returns comprehensive data including metadata, relationships, and computed fields. The response is paginated and supports filtering, sorting, and field selection through query parameters.`,
          tags: [`resource-${i}`, 'resources', 'read-operations'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: `Unique identifier for resource ${i}`,
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'include',
              in: 'query',
              description: 'Related resources to include in the response',
              schema: { type: 'array', items: { type: 'string' } },
            },
            {
              name: 'fields',
              in: 'query',
              description: 'Specific fields to return (sparse fieldsets)',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          type: { type: 'string', enum: ['resource'] },
                          attributes: {
                            type: 'object',
                            properties: {
                              name: { type: 'string', minLength: 1, maxLength: 255 },
                              description: { type: 'string', maxLength: 2000 },
                              status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
                              createdAt: { type: 'string', format: 'date-time' },
                              updatedAt: { type: 'string', format: 'date-time' },
                              metadata: {
                                type: 'object',
                                additionalProperties: true,
                              },
                            },
                            required: ['name', 'status', 'createdAt'],
                          },
                          relationships: {
                            type: 'object',
                            properties: {
                              owner: {
                                type: 'object',
                                properties: {
                                  data: {
                                    type: 'object',
                                    properties: {
                                      id: { type: 'string', format: 'uuid' },
                                      type: { type: 'string', enum: ['user'] },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        required: ['id', 'type', 'attributes'],
                      },
                      meta: {
                        type: 'object',
                        properties: {
                          timestamp: { type: 'string', format: 'date-time' },
                          version: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Resource not found',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string' },
                          message: { type: 'string' },
                          details: { type: 'array', items: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'string' },
                          message: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          security: [{ bearerAuth: [] }, { apiKey: [] }],
        },
        post: {
          operationId: `createResource${i}`,
          summary: `Create resource ${i}`,
          description: `Create a new instance of resource ${i}`,
          tags: [`resource-${i}`, 'resources', 'write-operations'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string' },
                  },
                  required: ['name'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created successfully' },
            '400': { description: 'Invalid request' },
            '401': { description: 'Unauthorized' },
          },
        },
        put: {
          operationId: `updateResource${i}`,
          summary: `Update resource ${i}`,
          description: `Update an existing instance of resource ${i}`,
          tags: [`resource-${i}`, 'resources', 'write-operations'],
          responses: {
            '200': { description: 'Updated successfully' },
            '404': { description: 'Not found' },
          },
        },
        delete: {
          operationId: `deleteResource${i}`,
          summary: `Delete resource ${i}`,
          description: `Delete an instance of resource ${i}`,
          tags: [`resource-${i}`, 'resources', 'delete-operations'],
          responses: {
            '204': { description: 'Deleted successfully' },
            '404': { description: 'Not found' },
          },
        },
      },
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    tags: Array.from({ length: 100 }, (_, i) => ({
      name: `resource-${i}`,
      description: `Operations related to resource ${i}`,
    })),
  })

  it('generates consistent hashes for large documents', () => {
    // This document is approximately 100KB+ in size
    expect(largeDocument.length).toBeGreaterThan(50000)

    // Generate hash multiple times and ensure consistency
    const hash1 = generateHash(largeDocument)
    const hash2 = generateHash(largeDocument)
    const hash3 = generateHash(largeDocument)
    const hash4 = generateHash(largeDocument)
    const hash5 = generateHash(largeDocument)

    // All hashes should be identical
    expect(hash1).toBe(hash2)
    expect(hash2).toBe(hash3)
    expect(hash3).toBe(hash4)
    expect(hash4).toBe(hash5)

    // Hash should be a valid 16-character hex string (128-bit hash represented as hex)
    expect(hash1).toMatch(/^[0-9a-f]{16}$/)

    // Verify the specific hash value to ensure algorithm stability
    // If this hash changes, it means the algorithm has changed
    expect(hash1).toBe('311581e39c1c331c')

    // Verify that even a tiny change produces a different hash
    const modifiedDocument = largeDocument + ' '
    const modifiedHash = generateHash(modifiedDocument)
    expect(modifiedHash).not.toBe(hash1)
  })

  it('produces different hash when a single character is changed in a large document', () => {
    // Generate hash of the original large document
    const originalHash = generateHash(largeDocument)

    // Change a single character in the middle of the document
    // We change '1.0.0' to '1.0.1' in the version field
    const middleIndex = largeDocument.indexOf('"version":"1.0.0"')
    expect(middleIndex).toBeGreaterThan(-1) // Ensure we found the text

    const modifiedDocument =
      largeDocument.slice(0, middleIndex + 17) +
      '1' + // Change last '0' to '1'
      largeDocument.slice(middleIndex + 18)

    // Generate hash of the modified document
    const modifiedHash = generateHash(modifiedDocument)

    // The hashes must be different, demonstrating avalanche effect
    expect(modifiedHash).not.toBe(originalHash)

    // Both should still be valid hash strings
    expect(originalHash).toMatch(/^[0-9a-f]{16}$/)
    expect(modifiedHash).toMatch(/^[0-9a-f]{16}$/)
  })

  it('consistently masks charCodeAt values above 255 in both main loop and remainder', () => {
    // Verifies that the & 0xff mask is applied consistently to charCodeAt results
    // in both the main loop and remainder sections, ensuring characters with code
    // points above 255 are treated as their lower 8 bits regardless of position

    // Character with code point 256: should be masked to 0 with & 0xff
    const char256 = String.fromCharCode(256) // 'Ā'
    expect(char256.charCodeAt(0)).toBe(256)
    expect(char256.charCodeAt(0) & 0xff).toBe(0) // Should be masked to 0

    // Test string sequences with char256
    const testSequence = char256 + 'test'

    // Version 1: char256 at position 0 (processed in main loop)
    const version1 = testSequence

    // Version 2: char256 at position 16 (processed in remainder section)
    const version2 = 'x'.repeat(16) + testSequence

    const hash1 = generateHash(version1)
    const hash2 = generateHash(version2)

    // With consistent & 0xff masking, these should produce stable hash values
    // hash1: character 256 masked to 0, then 'test'
    // hash2: 16 x's, then character 256 masked to 0, then 'test'

    // Expected hash values with fix applied (consistent & 0xff masking everywhere)
    const expectedHash1 = 'e73c7e761366649f'
    const expectedHash2 = 'dec9f1d0dbb9a70a'

    expect(hash1).toBe(expectedHash1)
    expect(hash2).toBe(expectedHash2)
  })
})
