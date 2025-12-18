import type { OpenApiDocument, OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getSelectedSecurity } from './get-selected-security'

describe('getSelectedSecurity', () => {
  it('returns operation-level selected security when x-scalar-set-operation-security is enabled', () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      'x-scalar-set-operation-security': true,
      'x-scalar-original-document-hash': '123',
    }

    const operation: OperationObject = {
      'x-scalar-selected-security': {
        selectedIndex: 2,
        selectedSchemes: [{ oauth2: [] }],
      },
    }

    const securityRequirements = [{ apiKey: [] }, { basicAuth: [] }, { oauth2: [] }]
    const result = getSelectedSecurity(document, operation, securityRequirements)
    expect(result).toEqual({
      selectedIndex: 2,
      selectedSchemes: [{ oauth2: [] }],
    })
  })

  it('returns document-level selected security when operation-level security is not set', () => {
    const document = {
      'x-scalar-original-document-hash': '123',
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      'x-scalar-selected-security': {
        selectedIndex: 1,
        selectedSchemes: [{ bearerAuth: [] }],
      },
    }

    const operation: OperationObject = {}
    const securityRequirements = [{ apiKey: [] }, { bearerAuth: [] }]
    const result = getSelectedSecurity(document, operation, securityRequirements)

    expect(result).toEqual({
      selectedIndex: 1,
      selectedSchemes: [{ bearerAuth: [] }],
    })
  })

  it('returns no selection when authentication is optional', () => {
    const document = {
      'x-scalar-original-document-hash': '123',
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
    }

    const operation: OperationObject = {}

    // Empty requirement makes auth optional
    const securityRequirements = [{ apiKey: [] }, {}]

    const result = getSelectedSecurity(document, operation, securityRequirements)

    expect(result).toEqual({
      selectedIndex: -1,
      selectedSchemes: [],
    })
  })

  it('defaults to the first security requirement when no custom selection exists', () => {
    const document = {
      'x-scalar-original-document-hash': '123',
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
    }

    const operation: OperationObject = {}
    const securityRequirements = [{ apiKey: [] }, { oauth2: [] }, { basicAuth: [] }]
    const result = getSelectedSecurity(document, operation, securityRequirements)

    expect(result).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ apiKey: [] }],
    })
  })

  it('returns no selection when security requirements array is empty', () => {
    const document = {
      'x-scalar-original-document-hash': '123',
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
    }

    const operation: OperationObject = {}
    const securityRequirements: Array<Record<string, string[]>> = []
    const result = getSelectedSecurity(document, operation, securityRequirements)

    expect(result).toEqual({
      selectedIndex: -1,
      selectedSchemes: [],
    })
  })
})
