import { describe, expect, it } from 'vitest'

import {
  getOAuthCallbackData,
  getOAuthCallbackParam,
  getOAuthCallbackParamWithSource,
  getOAuthCallbackParams,
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

  it('parses hash callback parameters with a leading question mark', () => {
    const { hashParams } = getOAuthCallbackParams(
      'https://callback.example.com/cb?ignored=query_value#?access_token=hash_token&state=hash_state',
    )

    expect(hashParams.get('access_token')).toBe('hash_token')
    expect(hashParams.get('state')).toBe('hash_state')
  })

  it('keeps duplicate callback parameters in source order', () => {
    const { searchParams, hashParams } = getOAuthCallbackParams(
      'https://callback.example.com/cb?state=first_query&state=second_query#state=first_hash&state=second_hash',
    )

    expect(searchParams.getAll('state')).toEqual(['first_query', 'second_query'])
    expect(hashParams.getAll('state')).toEqual(['first_hash', 'second_hash'])
    expect(getOAuthCallbackParamWithSource(searchParams, hashParams, 'state')).toEqual({
      params: searchParams,
      value: 'first_query',
    })
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

  it('keeps authorization-code state tied to the code source', () => {
    const result = getOAuthCallbackData(
      () => 'https://callback.example.com/cb?state=query_state#code=hash_code&state=hash_state',
    )

    expect(result.code).toBe('hash_code')
    expect(result.codeParams?.get('state')).toBe('hash_state')
    expect(result.accessToken).toBe(null)
    expect(result.accessTokenParams).toBe(null)
  })

  it('does not borrow query state for hash credentials', () => {
    const result = getOAuthCallbackData(
      () => 'https://callback.example.com/cb?state=query_state#access_token=hash_token',
    )

    expect(result.accessToken).toBe('hash_token')
    expect(result.accessTokenParams?.get('state')).toBe(null)
    expect(result.code).toBe(null)
    expect(result.codeParams).toBe(null)
  })

  it('uses the configured token name instead of a default access token', () => {
    const result = getOAuthCallbackData(
      () => 'https://callback.example.com/cb?custom_token=query_token&state=query_state#access_token=hash_token',
      'custom_token',
    )

    expect(result.accessToken).toBe('query_token')
    expect(result.accessTokenParams?.get('state')).toBe('query_state')
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

  it('returns empty callback data for invalid popup URLs', () => {
    const result = getOAuthCallbackData(() => 'not a valid callback url')

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
