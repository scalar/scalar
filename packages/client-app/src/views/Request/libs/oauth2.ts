import type { SecuritySchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'

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
  activeScheme: SecuritySchemeOauth2,
  schemeModel: SecuritySchemeOptionOauth,
) =>
  new Promise<string>((resolve, reject) => {
    const flow = activeScheme.flows[schemeModel.flowKey]
    if (!flow) return

    const scopes = flow.selectedScopes.join(' ')
    const state = (Math.random() + 1).toString(36).substring(7)
    const url = new URL(
      'authorizationUrl' in flow ? flow.authorizationUrl : flow.tokenUrl,
    )

    // Params unique to the flows
    if (schemeModel.flowKey === 'implicit') {
      url.searchParams.set('response_type', 'token')
    } else if (schemeModel.flowKey === 'authorizationCode') {
      url.searchParams.set('response_type', 'code')
    }

    // Common to all flows
    url.searchParams.set('client_id', activeScheme.clientId)
    url.searchParams.set('redirect_uri', window.location.href)
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
            const _state = authWindow.location.href.match(/state=([^&]*)/)?.[1]
            if (accessToken && _state === state) {
              resolve(accessToken)
            }
          }

          // Authorization Code Flow
          else if (code && 'tokenUrl' in flow) {
            const formData = new URLSearchParams()
            formData.set('grant_type', 'authorization_code')
            formData.set('client_id', activeScheme.clientId)
            formData.set('client_secret', flow.clientSecret)
            formData.set('redirect_uri', window.location.href)
            formData.set('scope', scopes)

            // Make the call
            // TODO add proxy here as well
            fetch(flow.tokenUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`${activeScheme.clientId}:${flow.clientSecret}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData,
            })
              .then((response) => {
                // Check if is a 2xx response
                if (!response.ok) {
                  reject(
                    new Error(
                      'Failed to get an access token. Please check your credentials.',
                    ),
                  )
                }
                return response.json()
              })
              .then((data) => {
                resolve(data.access_token)
              })
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
  })
