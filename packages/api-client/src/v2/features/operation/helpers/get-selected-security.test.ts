import { describe, expect, it } from 'vitest'

import { getSelectedSecurity } from './get-selected-security'

describe('getSelectedSecurity', () => {
  it('returns operation-level selected security when setOperationSecurity is enabled', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = {
      selectedIndex: 2,
      selectedSchemes: [{ oauth2: [] }],
    }
    const securityRequirements = [{ apiKey: [] }, { basicAuth: [] }, { oauth2: [] }]
    const setOperationSecurity = true

    const result = getSelectedSecurity(
      documentSelectedSecurity,
      operationSelectedSecurity,
      securityRequirements,
      setOperationSecurity,
    )

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
    const setOperationSecurity = false

    const result = getSelectedSecurity(
      documentSelectedSecurity,
      operationSelectedSecurity,
      securityRequirements,
      setOperationSecurity,
    )

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
    const setOperationSecurity = false

    const result = getSelectedSecurity(
      documentSelectedSecurity,
      operationSelectedSecurity,
      securityRequirements,
      setOperationSecurity,
    )

    expect(result).toEqual({
      selectedIndex: -1,
      selectedSchemes: [],
    })
  })

  it('defaults to the first security requirement when no custom selection exists', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = undefined
    const securityRequirements = [{ apiKey: [] }, { oauth2: [] }, { basicAuth: [] }]
    const setOperationSecurity = false

    const result = getSelectedSecurity(
      documentSelectedSecurity,
      operationSelectedSecurity,
      securityRequirements,
      setOperationSecurity,
    )

    expect(result).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ apiKey: [] }],
    })
  })

  it('returns no selection when security requirements array is empty', () => {
    const documentSelectedSecurity = undefined
    const operationSelectedSecurity = undefined
    const securityRequirements: Array<Record<string, string[]>> = []
    const setOperationSecurity = false

    const result = getSelectedSecurity(
      documentSelectedSecurity,
      operationSelectedSecurity,
      securityRequirements,
      setOperationSecurity,
    )

    expect(result).toEqual({
      selectedIndex: -1,
      selectedSchemes: [],
    })
  })
})
