import type {
  SecuritySchemeExampleValue,
  SecuritySchemeOauth2,
  SecuritySchemeOauth2ExampleValue,
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

/**
 * Authorize oauth2 flow
 *
 * @returns the accessToken
 */
export const authorizeOauth2 = (
  scheme: SecuritySchemeOauth2,
  example: SecuritySchemeOauth2ExampleValue,
) =>
  new Promise<string>((resolve, reject) => {
    const scopes = scheme.flow.selectedScopes.join(' ')

    // Client Credentials or Password Flow
    if (
      scheme.flow.type === 'clientCredentials' ||
      scheme.flow.type === 'password'
    ) {
      authorizeServers(
        scheme as SecuritySchemeOauth2NonImplicit,
        example,
        scopes,
      )
        .then(resolve)
        .catch(reject)
    }

    // OAuth2 flows with a login popup
    else {
      const state = (Math.random() + 1).toString(36).substring(7)
      const url = new URL(scheme.flow.authorizationUrl)

      // Params unique to the flows
      if (scheme.flow.type === 'implicit')
        url.searchParams.set('response_type', 'token')
      else if (scheme.flow.type === 'authorizationCode')
        url.searchParams.set('response_type', 'code')

      // Common to all flows
      url.searchParams.set('client_id', scheme['x-scalar-client-id'])
      url.searchParams.set('redirect_uri', scheme.flow['x-scalar-redirect-uri'])
      url.searchParams.set('scope', scopes)
      url.searchParams.set('state', state)

      const windowFeatures = 'left=100,top=100,width=800,height=600'
      const authWindow = window.open(url, 'openAuth2Window', windowFeatures)

      // Open up a window and poll until closed or we have the data we want
      if (authWindow) {
        const checkWindowClosed = setInterval(function () {
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
          } catch {
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
              if (accessToken && _state === state) {
                resolve(accessToken)
              }
            }

            // Authorization Code Server Flow
            else if (code) {
              authorizeServers(
                scheme as SecuritySchemeOauth2NonImplicit,
                example,
                scopes,
                code,
              )
                .then(resolve)
                .catch(reject)
            }
            // User closed window without authorizing
            else {
              clearInterval(checkWindowClosed)
              reject(
                new Error('Window was closed without granting authorization'),
              )
            }
          }
        }, 200)
      }
    }
  })

/**
 * Makes the BE authorization call to grab the token server to server
 * Used for clientCredentials and authorizationCode
 */
export const authorizeServers = async (
  scheme: SecuritySchemeOauth2NonImplicit,
  example: SecuritySchemeOauth2ExampleValue,
  scopes: string,
  code?: string,
): Promise<string> => {
  if (!('clientSecret' in example))
    throw new Error(
      'Authorize Servers only works for Client Credentials or Authorization Code flow',
    )
  if (!scheme.flow) throw new Error('OAuth2 flow was not defined')

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
    return access_token
  } catch {
    throw new Error(
      'Failed to get an access token. Please check your credentials.',
    )
  }
}
