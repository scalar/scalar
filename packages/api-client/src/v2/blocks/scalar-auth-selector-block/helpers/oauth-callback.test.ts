import { describe, expect, it } from 'vitest'

import {
  getOAuthCallbackData,
  getOAuthCallbackParam,
  getOAuthCallbackParams,
  getOAuthCallbackParamWithSource,
} from './oauth-callback'

describe('oauth-callback', () => {
  it('splits query and hash callback parameters', () => {
    const { searchParams, hashParams } = getOAuthCallbackParams(
      'https://callback.example.com/cb?code=query_code&state=query_state#access_token=hash_token&refresh_token=hash_refresh',
    )

    expect(searchParams.toString()).toBe('code=query_code&state=query_state')
    expect(hashParams.toString()).toBe('access_token=hash_token&refresh_token=hash_refresh')
  })

  it('decodes encoded query and hash values', () => {
    const { searchParams, hashParams } = getOAuthCallbackParams(
      'https://callback.example.com/cb?state=a%20b%2Bc#access_token=token%2Bwith%2Bplus',
    )

    expect(searchParams.get('state')).toBe('a b+c')
    expect(hashParams.get('access_token')).toBe('token+with+plus')
  })

  it('prefers query values when query and hash contain the same parameter', () => {
    const result = getOAuthCallbackParam(
      'https://callback.example.com/cb?state=query_state#state=hash_state&access_token=hash_token',
      'state',
    )

    expect(result).toBe('query_state')
  })

  it('falls back to hash values when a query parameter is absent', () => {
    const result = getOAuthCallbackParam('https://callback.example.com/cb?code=query_code#state=hash_state', 'state')

    expect(result).toBe('hash_state')
  })

  it('preserves empty callback values', () => {
    const result = getOAuthCallbackParam('https://callback.example.com/cb?state=#access_token=hash_token', 'state')

    expect(result).toBe('')
  })

  it('returns null when the parameter is absent from query and hash', () => {
    const result = getOAuthCallbackParam(
      'https://callback.example.com/cb?code=query_code#access_token=hash_token',
      'state',
    )

    expect(result).toBe(null)
  })

  it('throws for invalid callback URLs', () => {
    expect(() => getOAuthCallbackParams('not a valid callback url')).toThrow(TypeError)
  })

  it('returns the query parameter source when the parameter is in the query string', () => {
    const searchParams = new URLSearchParams('state=query_state')
    const hashParams = new URLSearchParams('state=hash_state')

    const result = getOAuthCallbackParamWithSource(searchParams, hashParams, 'state')

    expect(result.value).toBe('query_state')
    expect(result.params).toBe(searchParams)
  })

  it('returns the hash parameter source when the parameter is absent from the query string', () => {
    const searchParams = new URLSearchParams('code=query_code')
    const hashParams = new URLSearchParams('state=hash_state')

    const result = getOAuthCallbackParamWithSource(searchParams, hashParams, 'state')

    expect(result.value).toBe('hash_state')
    expect(result.params).toBe(hashParams)
  })

  it('returns null values when a source-aware callback parameter is absent', () => {
    const result = getOAuthCallbackParamWithSource(new URLSearchParams(), new URLSearchParams(), 'state')

    expect(result).toEqual({ params: null, value: null })
  })

  it('extracts source-aware callback data from query and hash parameters', () => {
    const result = getOAuthCallbackData(
      () =>
        'https://callback.example.com/cb?code=query_code&state=query_state&error=query_error#error_description=hash_error&refresh_token=hash_refresh',
    )

    expect(result.accessToken).toBe(null)
    expect(result.accessTokenParams).toBe(null)
    expect(result.code).toBe('query_code')
    expect(result.codeParams?.get('state')).toBe('query_state')
    expect(result.error).toBe('query_error')
    expect(result.errorDescription).toBe('hash_error')
    expect(result.refreshToken).toBe('hash_refresh')
  })

  it('extracts custom access tokens with their source parameters', () => {
    const result = getOAuthCallbackData(
      () => 'https://callback.example.com/cb?state=query_state#custom_token=hash_token&state=hash_state',
      'custom_token',
    )

    expect(result.accessToken).toBe('hash_token')
    expect(result.accessTokenParams?.get('state')).toBe('hash_state')
    expect(result.code).toBe(null)
    expect(result.codeParams).toBe(null)
  })

  it('returns empty callback data when the popup URL cannot be read', () => {
    const result = getOAuthCallbackData(() => {
      throw new Error('Cross-origin popup')
    })

    expect(result).toEqual({
      accessToken: null,
      accessTokenParams: null,
      code: null,
      codeParams: null,
      error: null,
      errorDescription: null,
      refreshToken: null,
    })
  })
})
