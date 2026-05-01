/**
 * Keeps a callback parameter paired with the URL component it was read from.
 * State validation depends on this source so query and hash values cannot be
 * mixed across different OAuth callback shapes.
 */
type OAuthCallbackParamResult = {
  /** The query or hash parameters that contained the value. */
  params: URLSearchParams | null
  /** The callback parameter value, or null when the parameter is missing. */
  value: string | null
}

/**
 * Normalized OAuth callback data used after the popup returns to a readable
 * redirect URL. Credential params are retained so callers can validate state
 * from the same URL component as the returned credential.
 */
type OAuthCallbackData = {
  /** Access token returned by implicit or token-based flows. */
  accessToken: string | null
  /** The URL component that contained the access token. */
  accessTokenParams: URLSearchParams | null
  /** Authorization code returned by authorization-code flows. */
  code: string | null
  /** The URL component that contained the authorization code. */
  codeParams: URLSearchParams | null
  /** OAuth error code returned by the provider. */
  error: string | null
  /** Provider-supplied details for the OAuth error. */
  errorDescription: string | null
  /** Refresh token returned by providers that include one in the callback. */
  refreshToken: string | null
}

/**
 * Splits an OAuth redirect URL into query and hash parameters.
 *
 * OAuth providers are inconsistent about where they return callback data:
 * authorization-code flows usually use the query string, while implicit flows
 * commonly use the URL fragment. Keeping both sets separate lets callers decide
 * which source should win when a provider sends duplicate keys.
 */
export const getOAuthCallbackParams = (
  callbackUrl: string,
): { searchParams: URLSearchParams; hashParams: URLSearchParams } => {
  const parsedUrl = new URL(callbackUrl)

  return {
    searchParams: parsedUrl.searchParams,
    hashParams: new URLSearchParams(parsedUrl.hash.slice(1)),
  }
}

/**
 * Reads a callback parameter from the query string first, then the hash fragment.
 *
 * Query-string values intentionally take precedence because they are the
 * standard location for authorization-code callbacks. The hash lookup keeps
 * implicit-flow callbacks and non-standard providers working.
 */
export const getOAuthCallbackParam = (callbackUrl: string, paramName: string): string | null => {
  const { searchParams, hashParams } = getOAuthCallbackParams(callbackUrl)
  return searchParams.get(paramName) ?? hashParams.get(paramName)
}

/**
 * Reads a callback parameter and returns the URL component it came from.
 *
 * OAuth state must be validated from the same component as the credential
 * (`code` or `access_token`) so mixed query/hash callbacks cannot pair a
 * trusted state with an untrusted credential.
 */
export const getOAuthCallbackParamWithSource = (
  searchParams: URLSearchParams,
  hashParams: URLSearchParams,
  paramName: string,
): OAuthCallbackParamResult => {
  const searchValue = searchParams.get(paramName)
  if (searchValue !== null) {
    return { params: searchParams, value: searchValue }
  }

  const hashValue = hashParams.get(paramName)
  if (hashValue !== null) {
    return { params: hashParams, value: hashValue }
  }

  return { params: null, value: null }
}

/**
 * Safely reads the OAuth popup callback data.
 *
 * Accessing the popup URL can throw while it is still on another origin, so
 * callers get null values until the popup returns to a readable callback URL.
 */
export const getOAuthCallbackData = (getCallbackUrl: () => string, tokenName = 'access_token'): OAuthCallbackData => {
  try {
    const { searchParams, hashParams } = getOAuthCallbackParams(getCallbackUrl())
    const accessTokenResult = getOAuthCallbackParamWithSource(searchParams, hashParams, tokenName)
    const codeResult = getOAuthCallbackParamWithSource(searchParams, hashParams, 'code')

    return {
      accessToken: accessTokenResult.value,
      accessTokenParams: accessTokenResult.params,
      code: codeResult.value,
      codeParams: codeResult.params,
      error: searchParams.get('error') ?? hashParams.get('error'),
      errorDescription: searchParams.get('error_description') ?? hashParams.get('error_description'),
      refreshToken: searchParams.get('refresh_token') ?? hashParams.get('refresh_token'),
    }
  } catch (_e) {
    // Ignore CORS errors while the popup is still on the provider origin.
    return {
      accessToken: null,
      accessTokenParams: null,
      code: null,
      codeParams: null,
      error: null,
      errorDescription: null,
      refreshToken: null,
    }
  }
}
