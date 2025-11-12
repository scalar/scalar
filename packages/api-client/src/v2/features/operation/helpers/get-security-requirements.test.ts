import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getSecurityRequirements } from './get-security-requirements'

const baseDocument = {
  'x-scalar-original-document-hash': '123',
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
}

describe('get-security-requirements', () => {
  it('returns operation security when it has specific requirements', () => {
    const document = {
      ...baseDocument,
      security: [{ apiKey: [] }],
    }

    const operation = {
      security: [{ oauth2: ['read:users'] }],
    }

    const result = getSecurityRequirements(document, operation)

    expect(result).toEqual([{ oauth2: ['read:users'] }])
  })

  it('returns document security when operation security is [{}] and document already has optional security', () => {
    const document = {
      ...baseDocument,
      security: [{ apiKey: [] }, {}] as const,
    } satisfies OpenApiDocument

    const operation = {
      security: [{}],
    }

    const result = getSecurityRequirements(document, operation)

    // Document security is returned as-is because it already includes optional
    expect(result).toEqual([{ apiKey: [] }, {}])
  })

  it('adds optional security to document security when operation security is [{}] and document does not have optional', () => {
    const document = {
      ...baseDocument,
      security: [{ apiKey: [] }, { oauth2: ['read'] }] as const,
    } satisfies OpenApiDocument

    const operation = {
      security: [{}],
    }

    const result = getSecurityRequirements(document, operation)

    // Optional security object is added to document security
    expect(result).toEqual([{ apiKey: [] }, { oauth2: ['read'] }, {}])
  })

  it('returns document security when operation security is undefined', () => {
    const document = {
      ...baseDocument,
      security: [{ bearerAuth: [] }],
    }

    const result = getSecurityRequirements(document, {})
    expect(result).toEqual([{ bearerAuth: [] }])
  })

  it('returns empty array when both operation and document security are undefined', () => {
    const result = getSecurityRequirements(baseDocument, {})
    expect(result).toEqual([])
  })
})
