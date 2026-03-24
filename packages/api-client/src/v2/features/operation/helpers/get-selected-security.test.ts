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
})
