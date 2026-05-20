import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getImportFromQuery } from './get-import-from-query'

describe('getImportFromQuery', () => {
  const mockLocation = (search: string): void => {
    vi.stubGlobal('window', {
      location: { search },
    })
  }

  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns undefined when url query param is missing', () => {
    mockLocation('?operation_path=/users&operation_method=get')

    expect(getImportFromQuery({ darkMode: false })).toBeUndefined()
  })

  it('returns url import data with light logo in light mode', () => {
    mockLocation('?url=https%3A%2F%2Fexample.com%2Fopenapi.json&light_logo=https%3A%2F%2Flogo')

    expect(getImportFromQuery({ darkMode: false })).toEqual({
      type: 'url',
      source: 'https://example.com/openapi.json',
      companyLogo: 'https://logo',
    })
  })

  it('returns url import data with dark logo in dark mode', () => {
    mockLocation('?url=https%3A%2F%2Fexample.com%2Fopenapi.json&dark_logo=https%3A%2F%2Fdark-logo')

    expect(getImportFromQuery({ darkMode: true })).toEqual({
      type: 'url',
      source: 'https://example.com/openapi.json',
      companyLogo: 'https://dark-logo',
    })
  })

  it('includes operation path and method when query params are valid', () => {
    mockLocation(
      '?url=https%3A%2F%2Fexample.com%2Fopenapi.json&operation_path=%2Fusers%2F%7Bid%7D&operation_method=GET',
    )

    expect(getImportFromQuery({ darkMode: false })).toEqual({
      type: 'url',
      source: 'https://example.com/openapi.json',
      companyLogo: null,
      operationPath: '/users/{id}',
      operationMethod: 'get',
    })
  })

  it('omits operation fields when operation_method is invalid', () => {
    mockLocation('?url=https%3A%2F%2Fexample.com%2Fopenapi.json&operation_path=/users&operation_method=INVALID')

    expect(getImportFromQuery({ darkMode: false })).toEqual({
      type: 'url',
      source: 'https://example.com/openapi.json',
      companyLogo: null,
    })
  })
})
