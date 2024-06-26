import type {
  SecuritySchemeOauth2,
  SelectedSchemeOauth2,
} from '@scalar/oas-utils/entities/workspace/security'

export type SecuritySchemeOptionBase = {
  id: string
  label: string
}
export type SecuritySchemeOptionOauth = SecuritySchemeOptionBase & {
  flowKey: keyof SecuritySchemeOauth2['flows']
  uid: string
}

/** Type for the dropdown options */
export type SecuritySchemeOption =
  | {
      id: string
      label: string
    }
  | SecuritySchemeOptionOauth

/**
 * Authorize oauth2 flow
 *
 * @returns the accessToken
 */
export const authorizeOauth2 = (
  activeScheme: SelectedSchemeOauth2,
  schemeModel: SecuritySchemeOptionOauth,
) =>
  new Promise<string>((resolve, reject) => {
    const { flow, scheme } = activeScheme

    // Client Credentials or Password Flow
    if (
      schemeModel.flowKey === 'clientCredentials' ||
      schemeModel.flowKey === 'password'
    ) {
      authorizeServers(activeScheme).then(resolve).catch(reject)
    }

    // OAuth2 flows with a login popup
    else {
      const scopes = flow.selectedScopes.join(' ')
      const state = (Math.random() + 1).toString(36).substring(7)
      const url = new URL(
        'authorizationUrl' in flow ? flow.authorizationUrl : flow.tokenUrl,
      )

      // Params unique to the flows
      if (schemeModel.flowKey === 'implicit')
        url.searchParams.set('response_type', 'token')
      else if (schemeModel.flowKey === 'authorizationCode')
        url.searchParams.set('response_type', 'code')

      // Common to all flows
      url.searchParams.set('client_id', scheme.clientId)
      url.searchParams.set('redirect_uri', scheme.redirectUri)
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
              if (accessToken && _state === state) {
                resolve(accessToken)
              }
            }

            // Authorization Code Server Flow
            else if (code) {
              authorizeServers(activeScheme, code).then(resolve).catch(reject)
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
  activeScheme: SelectedSchemeOauth2,
  code?: string,
): Promise<string> => {
  if (!('clientSecret' in activeScheme.flow))
    throw new Error(
      'Authorize Servers only works for Client Credentials or Authorization Code flow',
    )
  if (!activeScheme.flow) throw new Error('OAuth2 flow was not defined')

  const { flow, scheme } = activeScheme
  const scopes = flow.selectedScopes.join(' ')

  const formData = new URLSearchParams()
  formData.set('client_id', scheme.clientId)
  formData.set('scope', scopes)

  if (flow.clientSecret) formData.set('client_secret', flow.clientSecret)
  if (scheme.redirectUri) formData.set('redirect_uri', scheme.redirectUri)

  // Authorization Code
  if (code) {
    formData.set('code', code)
    formData.set('grant_type', 'authorization_code')
  }
  // Password
  if ('secondValue' in flow) {
    formData.set('grant_type', 'password')
    formData.set('username', flow.value)
    formData.set('password', flow.secondValue)
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
    if (scheme.clientId && flow.clientSecret) {
      headers.Authorization = `Basic ${btoa(`${scheme.clientId}:${flow.clientSecret}`)}`
    }

    // Make the call
    const resp = await fetch(flow.tokenUrl, {
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
