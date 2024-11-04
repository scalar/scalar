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
 * Generates a random string of specified length using crypto API
 * Length must be between 43 and 128 characters as per RFC 7636
 */
const generateCodeVerifier = (length = 64): string => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  return Array.from(array)
    .map(
      (x) =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[
          x % 66
        ],
    )
    .join('')
}

/** SHA-256 encodes a string */
const encodeChallenge = async (challenge: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(challenge)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return String.fromCharCode(...new Uint8Array(digest))
}

/**
 * Creates a code challenge from the code verifier
 */
const generateCodeChallenge = async (
  verifier: string,
  encoding: 'SHA-256' | 'plain' | 'no',
): Promise<string> => {
  const str =
    encoding === 'SHA-256' ? await encodeChallenge(verifier) : verifier

  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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
        if (scheme.flow['x-usePkce']) {
          const codeVerifier = generateCodeVerifier()
          const codeChallenge = await generateCodeChallenge(
            codeVerifier,
            scheme.flow['x-usePkce'],
          )

          // Set state for later verification
          pkce = {
            codeVerifier,
            codeChallenge,
            codeChallengeMethod: 'S256',
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
      url.searchParams.set('scope', scopes)
      url.searchParams.set('state', state)

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
  formData.set('scope', scopes)

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
