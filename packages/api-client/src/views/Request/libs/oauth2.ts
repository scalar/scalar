import type { ErrorResponse } from '@/libs'
import type {
  SecuritySchemeExampleValue,
  SecuritySchemeOauth2,
  SecuritySchemeOauth2ExampleValue,
  Server,
} from '@scalar/oas-utils/entities/spec'

/** Oauth2 security schemes which are not implicit */
type SecuritySchemeOauth2NonImplicit = Omit<SecuritySchemeOauth2, 'flow'> & {
  flow: Exclude<SecuritySchemeOauth2['flow'], { type: 'implicit' }>
}

/** Type guard to check for oauth2 example */
export const isOauth2Example = (
  example: SecuritySchemeExampleValue,
): example is SecuritySchemeOauth2ExampleValue =>
  example.type.startsWith('oauth')

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
export const generateCodeChallenge = async (
  verifier: string,
  encoding: 'SHA-256' | 'plain',
): Promise<string> => {
  if (encoding === 'plain') return verifier

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
  scheme: SecuritySchemeOauth2,
  example: SecuritySchemeOauth2ExampleValue,
  /** We use the active server to set a base for relative redirect uris */
  activeServer: Server,
): Promise<ErrorResponse<string>> => {
  try {
    const scopes = scheme.flow.selectedScopes.join(' ')

    // Client Credentials or Password Flow
    if (
      scheme.flow.type === 'clientCredentials' ||
      scheme.flow.type === 'password'
    ) {
      return authorizeServers(
        scheme as SecuritySchemeOauth2NonImplicit,
        example,
        scopes,
      )
    }

    // OAuth2 flows with a login popup
    else {
      const state = (Math.random() + 1).toString(36).substring(7)
      const url = new URL(scheme.flow.authorizationUrl)

      /** Special PKCE state */
      let pkce: PKCEState | null = null

      // Params unique to the flows
      if (scheme.flow.type === 'implicit') {
        url.searchParams.set('response_type', 'token')
      }

      // Authorization Code Flow
      else if (scheme.flow.type === 'authorizationCode') {
        url.searchParams.set('response_type', 'code')

        // PKCE
        if (scheme.flow['x-usePkce'] !== 'no') {
          const codeVerifier = generateCodeVerifier()
          const codeChallenge = await generateCodeChallenge(
            codeVerifier,
            scheme.flow['x-usePkce'],
          )

          // Set state for later verification
          pkce = {
            codeVerifier,
            codeChallenge,
            codeChallengeMethod:
              scheme.flow['x-usePkce'] === 'SHA-256' ? 'S256' : 'plain',
          }

          // Set the code challenge and method on the url
          url.searchParams.set('code_challenge', codeChallenge)
          url.searchParams.set(
            'code_challenge_method',
            pkce.codeChallengeMethod,
          )
        }
      }

      // Handle relative redirect uris
      if (scheme.flow['x-scalar-redirect-uri'].startsWith('/')) {
        const baseUrl =
          activeServer.url || window.location.origin + window.location.pathname
        const redirectUri = new URL(
          scheme.flow['x-scalar-redirect-uri'],
          baseUrl,
        ).toString()

        url.searchParams.set('redirect_uri', redirectUri)
      } else {
        url.searchParams.set(
          'redirect_uri',
          scheme.flow['x-scalar-redirect-uri'],
        )
      }

      // Common to all flows
      url.searchParams.set('client_id', scheme['x-scalar-client-id'])
      url.searchParams.set('state', state)
      if (scopes) url.searchParams.set('scope', scopes)

      const windowFeatures = 'left=100,top=100,width=800,height=600'
      const authWindow = window.open(url, 'openAuth2Window', windowFeatures)

      // Open up a window and poll until closed or we have the data we want
      if (authWindow) {
        // We need to return a promise here due to the setInterval
        return new Promise<ErrorResponse<string>>((resolve) => {
          const checkWindowClosed = setInterval(() => {
            let accessToken: string | null = null
            let code: string | null = null

            try {
              const urlParams = new URL(authWindow.location.href).searchParams
              accessToken = urlParams.get('access_token')
              code = urlParams.get('code')

              // We may get the properties in a hash
              const hashParams = new URLSearchParams(
                authWindow.location.href.split('#')[1],
              )
              accessToken ||= hashParams.get('access_token')
              code ||= hashParams.get('code')
            } catch (e) {
              // Ignore CORS error from popup
            }

            // The window has closed OR we have what we are looking for so we stop polling
            if (authWindow.closed || accessToken || code) {
              clearInterval(checkWindowClosed)
              authWindow.close()

              // Implicit Flow
              if (accessToken) {
                // State is a hash fragment and cannot be found through search params
                const _state =
                  authWindow.location.href.match(/state=([^&]*)/)?.[1]

                if (_state === state) {
                  resolve([null, accessToken])
                } else {
                  resolve([new Error('State mismatch'), null])
                }
              }

              // Authorization Code Server Flow
              else if (code) {
                const _state = new URL(
                  authWindow.location.href,
                ).searchParams.get('state')

                if (_state === state) {
                  authorizeServers(
                    scheme as SecuritySchemeOauth2NonImplicit,
                    example,
                    scopes,
                    code,
                    pkce,
                  ).then(resolve)
                } else {
                  resolve([new Error('State mismatch'), null])
                }
              }
              // User closed window without authorizing
              else {
                clearInterval(checkWindowClosed)
                resolve([
                  new Error('Window was closed without granting authorization'),
                  null,
                ])
              }
            }
          }, 200)
        })
      } else return [new Error('Failed to open auth window'), null]
    }
  } catch (e) {
    return [new Error('Failed to authorize oauth2 flow'), null]
  }
}

/**
 * Makes the BE authorization call to grab the token server to server
 * Used for clientCredentials and authorizationCode
 */
export const authorizeServers = async (
  scheme: SecuritySchemeOauth2NonImplicit,
  example: SecuritySchemeOauth2ExampleValue,
  scopes: string,
  code?: string,
  pkce?: PKCEState | null,
): Promise<ErrorResponse<string>> => {
  if (!('clientSecret' in example))
    return [
      new Error(
        'Authorize Servers only works for Password, Client Credentials or Authorization Code flow',
      ),
      null,
    ]
  if (!scheme.flow) return [new Error('OAuth2 flow was not defined'), null]

  const formData = new URLSearchParams()
  formData.set('client_id', scheme['x-scalar-client-id'])
  if (scopes) formData.set('scope', scopes)

  if (example.clientSecret) formData.set('client_secret', example.clientSecret)
  if ('x-scalar-redirect-uri' in scheme.flow)
    formData.set('redirect_uri', scheme.flow['x-scalar-redirect-uri'])

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
  else if (example.type === 'oauth-password') {
    formData.set('grant_type', 'password')
    formData.set('username', example.username)
    formData.set('password', example.password)
  }
  // Client Credentials
  else {
    formData.set('grant_type', 'client_credentials')
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    }

    // Add client id + secret to headers
    if (scheme['x-scalar-client-id'] && example.clientSecret)
      headers.Authorization = `Basic ${btoa(`${scheme['x-scalar-client-id']}:${example.clientSecret}`)}`

    // Make the call
    const resp = await fetch(scheme.flow.tokenUrl, {
      method: 'POST',
      headers,
      body: formData,
    })
    const { access_token } = await resp.json()
    return [null, access_token]
  } catch {
    return [
      new Error(
        'Failed to get an access token. Please check your credentials.',
      ),
      null,
    ]
  }
}
