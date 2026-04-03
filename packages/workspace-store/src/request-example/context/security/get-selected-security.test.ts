import { describe, expect, it } from 'vitest'

import { getSelectedSecurity } from './get-selected-security'

describe('getSelectedSecurity', () => {
  it('returns operation-level selected security when set', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = {
      selectedIndex: 2,
      selectedSchemes: [{ oauth2: [] }],
    }
    const securityRequirements = [{ apiKey: [] }, { basicAuth: [] }, { oauth2: [] }]

    const result = getSelectedSecurity(documentSelectedSecurity, operationSelectedSecurity, securityRequirements)

    expect(result).toEqual({
      selectedIndex: 2,
      selectedSchemes: [{ oauth2: [] }],
    })
  })

  it('returns document-level selected security when operation-level security is not set', () => {
    const documentSelectedSecurity = {
      selectedIndex: 1,
      selectedSchemes: [{ bearerAuth: [] }],
    }
    const operationSelectedSecurity = undefined
    const securityRequirements = [{ apiKey: [] }, { bearerAuth: [] }]

    const result = getSelectedSecurity(documentSelectedSecurity, operationSelectedSecurity, securityRequirements)

    expect(result).toEqual({
      selectedIndex: 1,
      selectedSchemes: [{ bearerAuth: [] }],
    })
  })

  it('returns no selection when authentication is optional', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = undefined
    // Empty requirement makes auth optional
    const securityRequirements = [{ apiKey: [] }, {}]

    const result = getSelectedSecurity(documentSelectedSecurity, operationSelectedSecurity, securityRequirements)

    expect(result).toEqual({
      selectedIndex: -1,
      selectedSchemes: [],
    })
  })

  it('defaults to the first security requirement when no custom selection exists', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = undefined
    const securityRequirements = [{ apiKey: [] }, { oauth2: [] }, { basicAuth: [] }]

    const result = getSelectedSecurity(documentSelectedSecurity, operationSelectedSecurity, securityRequirements)

    expect(result).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ apiKey: [] }],
    })
  })

  it('applies oauth2 x-default-scopes when defaulting to the first requirement', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = undefined
    const securityRequirements = [{ OAuth2: [] }]
    const securitySchemes = {
      OAuth2: {
        type: 'oauth2',
        'x-default-scopes': ['api://client/access_as_user'],
      },
    }

    const result = getSelectedSecurity(
      documentSelectedSecurity,
      operationSelectedSecurity,
      securityRequirements,
      securitySchemes,
    )

    expect(result).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ OAuth2: ['api://client/access_as_user'] }],
    })
  })

  it('keeps explicit requirement scopes when they are already present', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = undefined
    const securityRequirements = [{ OAuth2: ['read:data'] }]
    const securitySchemes = {
      OAuth2: {
        type: 'oauth2',
        'x-default-scopes': ['api://client/access_as_user'],
      },
    }

    const result = getSelectedSecurity(
      documentSelectedSecurity,
      operationSelectedSecurity,
      securityRequirements,
      securitySchemes,
    )

    expect(result).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ OAuth2: ['read:data'] }],
    })
  })

  it('returns no selection when security requirements array is empty', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = undefined
    const securityRequirements: Array<Record<string, string[]>> = []

    const result = getSelectedSecurity(documentSelectedSecurity, operationSelectedSecurity, securityRequirements)

    expect(result).toEqual({
      selectedIndex: -1,
      selectedSchemes: [],
    })
  })

  describe('preferredSecurityScheme', () => {
    it('uses preferred security scheme when provided as string', () => {
      const securityRequirements = [{ apiKey: [] }, { bearerAuth: [] }, { oauth2: [] }]
      const securitySchemes = {
        apiKey: { type: 'apiKey' },
        bearerAuth: { type: 'http' },
        oauth2: { type: 'oauth2' },
      }

      const result = getSelectedSecurity(undefined, undefined, securityRequirements, securitySchemes, 'bearerAuth')

      expect(result).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ bearerAuth: [] }],
      })
    })

    it('uses preferred security scheme when provided as array', () => {
      const securityRequirements = [{ apiKey: [] }, { oauth2: [] }]
      const securitySchemes = {
        apiKey: { type: 'apiKey' },
        oauth2: { type: 'oauth2' },
      }

      const result = getSelectedSecurity(undefined, undefined, securityRequirements, securitySchemes, ['oauth2'])

      expect(result).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ oauth2: [] }],
      })
    })

    it('applies x-default-scopes to preferred oauth2 scheme', () => {
      const securityRequirements = [{ apiKey: [] }, { oauth2: [] }]
      const securitySchemes = {
        apiKey: { type: 'apiKey' },
        oauth2: {
          type: 'oauth2',
          'x-default-scopes': ['read:data', 'write:data'],
        },
      }

      const result = getSelectedSecurity(undefined, undefined, securityRequirements, securitySchemes, 'oauth2')

      expect(result).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ oauth2: ['read:data', 'write:data'] }],
      })
    })

    it('handles preferred scheme not in requirements (returns -1 index)', () => {
      const securityRequirements = [{ apiKey: [] }, { bearerAuth: [] }]
      const securitySchemes = {
        apiKey: { type: 'apiKey' },
        bearerAuth: { type: 'http' },
        oauth2: { type: 'oauth2' },
      }

      const result = getSelectedSecurity(undefined, undefined, securityRequirements, securitySchemes, 'oauth2')

      expect(result).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ oauth2: [] }],
      })
    })

    it('handles complex preferred scheme with multiple schemes', () => {
      const securityRequirements = [{ apiKey: [] }, { oauth2: [], apiKey: [] }]
      const securitySchemes = {
        apiKey: { type: 'apiKey' },
        oauth2: { type: 'oauth2' },
      }

      const result = getSelectedSecurity(undefined, undefined, securityRequirements, securitySchemes, [
        'oauth2',
        'apiKey',
      ])

      expect(result).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ oauth2: [], apiKey: [] }],
      })
    })

    it('handles nested array in preferred scheme', () => {
      const securityRequirements = [{ apiKey: [] }]
      const securitySchemes = {
        apiKey: { type: 'apiKey' },
        oauth2: {
          type: 'oauth2',
          'x-default-scopes': ['scope1'],
        },
        basic: { type: 'http' },
      }

      const result = getSelectedSecurity(undefined, undefined, securityRequirements, securitySchemes, [
        ['oauth2', 'basic'],
        'apiKey',
      ])

      expect(result).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ oauth2: ['scope1'], basic: [], apiKey: [] }],
      })
    })

    it('preferred scheme takes priority over first requirement but not over stored selection', () => {
      const documentSelectedSecurity = {
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      }
      const securityRequirements = [{ apiKey: [] }, { oauth2: [] }]
      const securitySchemes = {
        apiKey: { type: 'apiKey' },
        oauth2: { type: 'oauth2' },
      }

      const result = getSelectedSecurity(
        documentSelectedSecurity,
        undefined,
        securityRequirements,
        securitySchemes,
        'oauth2',
      )

      expect(result).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      })
    })

    it('uses preferred scheme even when auth is optional', () => {
      const securityRequirements = [{ apiKey: [] }, {}]
      const securitySchemes = {
        apiKey: { type: 'apiKey' },
      }

      const result = getSelectedSecurity(undefined, undefined, securityRequirements, securitySchemes, 'apiKey')

      expect(result).toEqual({
        selectedIndex: 0,
        selectedSchemes: [{ apiKey: [] }],
      })
    })
  })
})
