import type {
  OpenApiDocument,
  OperationObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { filterSelectedSecurity } from './filter-selected-security'

describe('filterSelectedSecurity', () => {
  /**
   * Test 1: Returns empty array when no security requirements exist
   * Critical because this is the most common edge case - operations without auth
   */
  it('returns empty array when operation and document have no security requirements', () => {
    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      'x-scalar-original-document-hash': 'test-hash',
    }

    const operation: OperationObject = {
      responses: {},
    }

    const result = filterSelectedSecurity(document, operation)

    expect(result).toEqual([])
  })

  /**
   * Test 2: Returns empty array when selected security does not match operation requirements
   * Critical because this tests the core filtering logic - mismatched security should return nothing
   */
  it('returns empty array when selected security does not match any operation requirements', () => {
    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      'x-scalar-original-document-hash': 'test-hash',
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            'x-scalar-secret-token': '',
          },
          oauth2: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://example.com/oauth',
                refreshUrl: '',
                scopes: {},
                'x-scalar-secret-client-id': '',
                'x-scalar-secret-token': '',
                'x-scalar-secret-redirect-uri': '',
              },
            },
          },
        },
      },
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      },
    }

    const operation: OperationObject = {
      responses: {},
      // Operation requires oauth2, but apiKey is selected
      security: [{ oauth2: [] }],
    }

    const result = filterSelectedSecurity(document, operation)

    expect(result).toEqual([])
  })

  /**
   * Test 3: Returns correct security scheme when selected security matches operation requirement
   * Critical because this is the primary happy path - matching security should return the scheme
   */
  it('returns correct security scheme when selected security matches operation requirement', () => {
    const apiKeyScheme: SecuritySchemeObject = {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': '',
    }

    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      'x-scalar-original-document-hash': 'test-hash',
      components: {
        securitySchemes: {
          apiKey: apiKeyScheme,
        },
      },
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      },
    }

    const operation: OperationObject = {
      responses: {},
      security: [{ apiKey: [] }],
    }

    const result = filterSelectedSecurity(document, operation)

    expect(result).toEqual([apiKeyScheme])
  })

  /**
   * Test 4: Prioritizes selectedIndex over other selected schemes
   * Critical because the function should respect the user's explicit selection priority
   */
  it('returns security scheme at selectedIndex when multiple schemes are selected and match', () => {
    const apiKeyScheme: SecuritySchemeObject = {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': '',
    }

    const bearerScheme: SecuritySchemeObject = {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      'x-scalar-secret-username': '',
      'x-scalar-secret-password': '',
      'x-scalar-secret-token': '',
    }

    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      'x-scalar-original-document-hash': 'test-hash',
      components: {
        securitySchemes: {
          apiKey: apiKeyScheme,
          bearer: bearerScheme,
        },
      },
      'x-scalar-selected-security': {
        // Bearer is selected at index 1
        selectedIndex: 1,
        selectedSchemes: [{ apiKey: [] }, { bearer: [] }],
      },
    }

    const operation: OperationObject = {
      responses: {},
      // Both security schemes are valid for this operation
      security: [{ apiKey: [] }, { bearer: [] }],
    }

    const result = filterSelectedSecurity(document, operation)

    // Should return bearer because it is at selectedIndex
    expect(result).toEqual([bearerScheme])
  })

  /**
   * Test 5: Handles complex security requirements with multiple schemes (AND logic)
   * Critical because OpenAPI supports combining multiple security schemes with AND logic
   * This tests that the key generation correctly handles sorted multi-key requirements
   */
  it('correctly matches complex security requirements with multiple schemes', () => {
    const apiKeyScheme: SecuritySchemeObject = {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': '',
    }

    const oauth2Scheme: SecuritySchemeObject = {
      type: 'oauth2',
      flows: {
        implicit: {
          authorizationUrl: 'https://example.com/oauth',
          refreshUrl: '',
          scopes: {
            'read:data': 'Read data',
            'write:data': 'Write data',
          },
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-token': '',
          'x-scalar-secret-redirect-uri': '',
        },
      },
    }

    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      'x-scalar-original-document-hash': 'test-hash',
      components: {
        securitySchemes: {
          apiKey: apiKeyScheme,
          oauth2: oauth2Scheme,
        },
      },
      'x-scalar-selected-security': {
        selectedIndex: 0,
        // Selected security requires BOTH apiKey AND oauth2 (keys in different order)
        selectedSchemes: [{ oauth2: ['read:data'], apiKey: [] }],
      },
    }

    const operation: OperationObject = {
      responses: {},
      // Operation requires BOTH apiKey AND oauth2 (keys in different order than selected)
      security: [{ apiKey: [], oauth2: ['read:data'] }],
    }

    const result = filterSelectedSecurity(document, operation)

    // Should match despite different key order and return both schemes
    expect(result).toHaveLength(2)
    expect(result).toContainEqual(apiKeyScheme)
    expect(result).toContainEqual(oauth2Scheme)
  })

  /**
   * Bonus Test 6: Falls back to document-level security when operation has no security
   * Critical for understanding the fallback behavior between operation and document security
   */
  it('uses document-level security when operation has no security defined', () => {
    const apiKeyScheme: SecuritySchemeObject = {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': '',
    }

    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      'x-scalar-original-document-hash': 'test-hash',
      components: {
        securitySchemes: {
          apiKey: apiKeyScheme,
        },
      },
      // Document-level security
      security: [{ apiKey: [] }],
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      },
    }

    const operation: OperationObject = {
      responses: {},
      // No operation-level security, should fall back to document
    }

    const result = filterSelectedSecurity(document, operation)

    expect(result).toEqual([apiKeyScheme])
  })

  /**
   * Bonus Test 7: Returns empty array when selectedSchemes is empty
   * Critical edge case - no selected security should return nothing
   */
  it('returns empty array when selectedSchemes is empty', () => {
    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      'x-scalar-original-document-hash': 'test-hash',
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            'x-scalar-secret-token': '',
          },
        },
      },
      security: [{ apiKey: [] }],
      'x-scalar-selected-security': {
        selectedIndex: -1,
        selectedSchemes: [],
      },
    }

    const operation: OperationObject = {
      responses: {},
      security: [{ apiKey: [] }],
    }

    const result = filterSelectedSecurity(document, operation)

    expect(result).toEqual([])
  })

  /**
   * Bonus Test 8: Handles null operation gracefully
   * Critical for robustness - function should handle null operation without crashing
   */
  it('handles null operation by using document-level security', () => {
    const apiKeyScheme: SecuritySchemeObject = {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
      'x-scalar-secret-token': '',
    }

    const document: OpenApiDocument = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      'x-scalar-original-document-hash': 'test-hash',
      components: {
        securitySchemes: {
          apiKey: apiKeyScheme,
        },
      },
      security: [{ apiKey: [] }],
      'x-scalar-selected-security': {
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      },
    }

    const result = filterSelectedSecurity(document, null)

    expect(result).toEqual([apiKeyScheme])
  })
})
