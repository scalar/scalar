import type { ErrorResponse } from '@/libs/errors'
import type { Oauth2Flow, Server } from '@scalar/oas-utils/entities/spec'
import { shouldUseProxy } from '@scalar/oas-utils/helpers'

/** Oauth2 security schemes which are not implicit */
type NonImplicitFlow = Exclude<Oauth2Flow, { type: 'implicit' }>

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
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
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
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Authorize oauth2 flow
 *
 * @returns the accessToken
 */
export const authorizeOauth2 = async (
  flow: Oauth2Flow,
  /** We use the active server to set a base for relative redirect uris */
  activeServer: Server,
  /** If we want to use the proxy */
  proxyUrl?: string,
): Promise<ErrorResponse<string>> => {
  try {
    if (!flow) {
      return [new Error('Flow not found'), null]
    }

    const scopes = flow.selectedScopes.join(' ')

    // Client Credentials or Password Flow
    if (flow.type === 'clientCredentials' || flow.type === 'password') {
      return authorizeServers(flow, scopes, {
        proxyUrl,
      })
    }

    // OAuth2 flows with a login popup

    // Generate a random state string with the length of 8 characters
    const state = (Math.random() + 1).toString(36).substring(2, 10)
    const url = new URL(flow.authorizationUrl)

    /** Special PKCE state */
    let pkce: PKCEState | null = null

    // Params unique to the flows
    if (flow.type === 'implicit') {
      url.searchParams.set('response_type', 'token')
    }

    // Authorization Code Flow
    else if (flow.type === 'authorizationCode') {
      url.searchParams.set('response_type', 'code')

      // PKCE
      if (flow['x-usePkce'] !== 'no') {
        const codeVerifier = generateCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier, flow['x-usePkce'])

        // Set state for later verification
        pkce = {
          codeVerifier,
          codeChallenge,
          codeChallengeMethod: flow['x-usePkce'] === 'SHA-256' ? 'S256' : 'plain',
        }

        // Set the code challenge and method on the url
        url.searchParams.set('code_challenge', codeChallenge)
        url.searchParams.set('code_challenge_method', pkce.codeChallengeMethod)
      }
    }

    // Handle relative redirect uris
    if (flow['x-scalar-redirect-uri'].startsWith('/')) {
      const baseUrl = activeServer.url || window.location.origin + window.location.pathname
      const redirectUri = new URL(flow['x-scalar-redirect-uri'], baseUrl).toString()

      url.searchParams.set('redirect_uri', redirectUri)
    } else {
      url.searchParams.set('redirect_uri', flow['x-scalar-redirect-uri'])
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
    url.searchParams.set('client_id', flow['x-scalar-client-id'])
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
            else if (code) {
              const _state = new URL(authWindow.location.href).searchParams.get('state')

              if (_state === state) {
                authorizeServers(flow as NonImplicitFlow, scopes, {
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
  flow: NonImplicitFlow,
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
  if (!flow) {
    return [new Error('OAuth2 flow was not defined'), null]
  }

  const formData = new URLSearchParams()
  formData.set('client_id', flow['x-scalar-client-id'])

  // Only client credentials and password flows support scopes in the token request
  if (scopes && (flow.type === 'clientCredentials' || flow.type === 'password')) {
    formData.set('scope', scopes)
  }

  // Only add the secret if a credentials location is not specified (backwards compatibility) or is set to body
  const shouldAddSecretToBody =
    flow.clientSecret && (!flow['x-scalar-credentials-location'] || flow['x-scalar-credentials-location'] === 'body')

  if (shouldAddSecretToBody) {
    formData.set('client_secret', flow.clientSecret)
  }
  if ('x-scalar-redirect-uri' in flow && flow['x-scalar-redirect-uri']) {
    formData.set('redirect_uri', flow['x-scalar-redirect-uri'])
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
  else if (flow.type === 'password') {
    formData.set('grant_type', 'password')
    formData.set('username', flow.username)
    formData.set('password', flow.password)
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
      flow.clientSecret &&
      (!flow['x-scalar-credentials-location'] || flow['x-scalar-credentials-location'] === 'header')

    // Add client id + secret to headers
    if (shouldAddSecretToHeader) {
      headers.Authorization = `Basic ${btoa(`${flow['x-scalar-client-id']}:${flow.clientSecret}`)}`
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
