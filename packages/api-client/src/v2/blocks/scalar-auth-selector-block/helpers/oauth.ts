import { shouldUseProxy } from '@scalar/oas-utils/helpers'
import type { OAuthFlowsObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { encode, fromUint8Array } from 'js-base64'

import type { ErrorResponse } from '@/libs/errors'

/** Oauth2 security schemes which are not implicit */
type NonImplicitFlow = Omit<OAuthFlowsObject, 'implicit'>

type PKCEState = {
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: string
}

/**
 * Generates a random string for PKCE code verifier
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636#page-8
 */
const generateCodeVerifier = (): string => {
  // Generate 32 random bytes
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)

  // Base64URL encode the bytes
  return fromUint8Array(buffer, true)
}

/**
 * Creates a code challenge from the code verifier
 */
export const generateCodeChallenge = async (verifier: string, encoding: 'SHA-256' | 'plain'): Promise<string> => {
  if (encoding === 'plain') {
    return verifier
  }

  // ASCII encoding is just taking the lower 8 bits of each character
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)

  // Base64URL encode the bytes
  return fromUint8Array(new Uint8Array(digest), true)
}

/**
 * Authorize oauth2 flow
 *
 * @returns the accessToken
 */
export const authorizeOauth2 = async (
  flows: OAuthFlowsObject,
  type: keyof OAuthFlowsObject,
  selectedScopes: string[],
  /** We use the active server to set a base for relative redirect uris */
  activeServer: ServerObject,
  /** If we want to use the proxy */
  proxyUrl?: string,
): Promise<ErrorResponse<string>> => {
  const flow = flows[type]

  try {
    if (!flow) {
      return [new Error('Flow not found'), null]
    }

    const scopes = selectedScopes.join(' ')

    // Client Credentials or Password Flow
    if (type === 'clientCredentials' || type === 'password') {
      return authorizeServers(flows, type, scopes, {
        proxyUrl,
      })
    }

    // OAuth2 flows with a login popup

    // Generate a random state string with the length of 8 characters
    const state = (Math.random() + 1).toString(36).substring(2, 10)
    const url = new URL(flows[type]!.authorizationUrl)

    /** Special PKCE state */
    let pkce: PKCEState | null = null

    // Params unique to the flows
    if (type === 'implicit') {
      url.searchParams.set('response_type', 'token')
    } else if (type === 'authorizationCode') {
      const typedFlow = flows[type]! // Safe to assert due to earlier check

      url.searchParams.set('response_type', 'code')

      // PKCE
      if (typedFlow['x-usePkce'] !== 'no') {
        const codeVerifier = generateCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier, typedFlow['x-usePkce'])

        // Set state for later verification
        pkce = {
          codeVerifier,
          codeChallenge,
          codeChallengeMethod: typedFlow['x-usePkce'] === 'SHA-256' ? 'S256' : 'plain',
        }

        // Set the code challenge and method on the url
        url.searchParams.set('code_challenge', codeChallenge)
        url.searchParams.set('code_challenge_method', pkce.codeChallengeMethod)
      }
    }

    const typedFlow = flows[type]! // Safe to assert due to earlier check

    // Handle relative redirect uris
    if (typedFlow['x-scalar-secret-redirect-uri'].startsWith('/')) {
      const baseUrl = activeServer.url || window.location.origin + window.location.pathname
      const redirectUri = new URL(typedFlow['x-scalar-secret-redirect-uri'], baseUrl).toString()

      url.searchParams.set('redirect_uri', redirectUri)
    } else {
      url.searchParams.set('redirect_uri', typedFlow['x-scalar-secret-redirect-uri'])
    }

    if (flow['x-scalar-security-query']) {
      Object.keys(flow['x-scalar-security-query']).forEach((key: string): void => {
        const value = flow['x-scalar-security-query']?.[key]
        if (!value) {
          return
        }
        url.searchParams.set(key, value)
      })
    }

    // Common to all flows
    url.searchParams.set('client_id', flow['x-scalar-secret-client-id'])
    url.searchParams.set('state', state)
    if (scopes) {
      url.searchParams.set('scope', scopes)
    }

    const windowFeatures = 'left=100,top=100,width=800,height=600'
    const authWindow = window.open(url, 'openAuth2Window', windowFeatures)

    // Open up a window and poll until closed or we have the data we want
    if (authWindow) {
      // We need to return a promise here due to the setInterval
      return new Promise<ErrorResponse<string>>((resolve) => {
        const checkWindowClosed = setInterval(() => {
          let accessToken: string | null = null
          let code: string | null = null
          let error: string | null = null
          let errorDescription: string | null = null

          try {
            const urlParams = new URL(authWindow.location.href).searchParams
            const tokenName = flow['x-tokenName'] || 'access_token'
            accessToken = urlParams.get(tokenName)
            code = urlParams.get('code')

            error = urlParams.get('error')
            errorDescription = urlParams.get('error_description')

            // We may get the properties in a hash
            const hashParams = new URLSearchParams(authWindow.location.href.split('#')[1])
            accessToken ||= hashParams.get(tokenName)
            code ||= hashParams.get('code')
            error ||= hashParams.get('error')
            errorDescription ||= hashParams.get('error_description')
          } catch (_e) {
            // Ignore CORS error from popup
          }

          // The window has closed OR we have what we are looking for so we stop polling
          if (authWindow.closed || accessToken || code || error) {
            clearInterval(checkWindowClosed)
            authWindow.close()

            if (error) {
              resolve([new Error(`OAuth error: ${error}${errorDescription ? ` (${errorDescription})` : ''}`), null])
            }

            // Implicit Flow
            else if (accessToken) {
              // State is a hash fragment and cannot be found through search params
              const _state = authWindow.location.href.match(/state=([^&]*)/)?.[1]

              if (_state === state) {
                resolve([null, accessToken])
              } else {
                resolve([new Error('State mismatch'), null])
              }
            }

            // Authorization Code Server Flow
            else if (code && type === 'authorizationCode') {
              const _state = new URL(authWindow.location.href).searchParams.get('state')

              if (_state === state) {
                authorizeServers(flows, type, scopes, {
                  code,
                  pkce,
                  proxyUrl,
                }).then(resolve)
              } else {
                resolve([new Error('State mismatch'), null])
              }
            }
            // User closed window without authorizing
            else {
              clearInterval(checkWindowClosed)
              resolve([new Error('Window was closed without granting authorization'), null])
            }
          }
        }, 200)
      })
    }
    return [new Error('Failed to open auth window'), null]
  } catch (_) {
    return [new Error('Failed to authorize oauth2 flow'), null]
  }
}

/**
 * Makes the BE authorization call to grab the token server to server
 * Used for clientCredentials and authorizationCode
 */
export const authorizeServers = async (
  flows: NonImplicitFlow,
  type: keyof NonImplicitFlow,
  scopes: string,
  {
    code,
    pkce,
    proxyUrl,
  }: {
    code?: string
    pkce?: PKCEState | null
    proxyUrl?: string | undefined
  } = {},
): Promise<ErrorResponse<string>> => {
  const flow = flows[type]

  if (!flow) {
    return [new Error('OAuth2 flow was not defined'), null]
  }

  const formData = new URLSearchParams()
  formData.set('client_id', flow['x-scalar-secret-client-id'])

  // Only client credentials and password flows support scopes in the token request
  if (scopes && (type === 'clientCredentials' || type === 'password')) {
    formData.set('scope', scopes)
  }

  // Only add the secret if a credentials location is not specified (backwards compatibility) or is set to body
  const shouldAddSecretToBody =
    flow['x-scalar-secret-client-secret'] &&
    (!flow['x-scalar-credentials-location'] || flow['x-scalar-credentials-location'] === 'body')

  if (shouldAddSecretToBody) {
    formData.set('client_secret', flow['x-scalar-secret-client-secret'])
  }
  if ('x-scalar-secret-redirect-uri' in flow && flow['x-scalar-secret-redirect-uri']) {
    formData.set('redirect_uri', flow['x-scalar-secret-redirect-uri'])
  }

  // Authorization Code
  if (code) {
    formData.set('code', code)
    formData.set('grant_type', 'authorization_code')

    // PKCE
    if (pkce) {
      formData.set('code_verifier', pkce.codeVerifier)
    }
  }
  // Password
  else if (type === 'password') {
    const typedFlow = flows[type]! // Safe to assert due to earlier check
    formData.set('grant_type', 'password')
    formData.set('username', typedFlow['x-scalar-secret-username'])
    formData.set('password', typedFlow['x-scalar-secret-password'])
  }
  // Client Credentials
  else {
    formData.set('grant_type', 'client_credentials')
  }

  // Additional request body parameters
  if (flow['x-scalar-security-body']) {
    Object.entries(flow['x-scalar-security-body']).forEach(([key, value]) => {
      if (value) {
        formData.set(key, value)
      }
    })
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    }

    // Only add the secret if a credentials location is not specified (backwards compatibility) or is set to header
    const shouldAddSecretToHeader =
      flow['x-scalar-secret-client-secret'] &&
      (!flow['x-scalar-credentials-location'] || flow['x-scalar-credentials-location'] === 'header')

    // Add client id + secret to headers
    if (shouldAddSecretToHeader) {
      headers.Authorization = `Basic ${encode(`${flow['x-scalar-secret-client-id']}:${flow['x-scalar-secret-client-secret']}`)}`
    }

    // Check if we should use the proxy
    const url = shouldUseProxy(proxyUrl, flow.tokenUrl)
      ? `${proxyUrl}?${new URLSearchParams([['scalar_url', flow.tokenUrl]]).toString()}`
      : flow.tokenUrl

    // Make the call
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })
    const responseData = await resp.json()

    // Use custom token name if specified, otherwise default to access_token
    const tokenName = flow['x-tokenName'] || 'access_token'
    const accessToken = responseData[tokenName]

    return [null, accessToken]
  } catch {
    return [new Error('Failed to get an access token. Please check your credentials.'), null]
  }
}
