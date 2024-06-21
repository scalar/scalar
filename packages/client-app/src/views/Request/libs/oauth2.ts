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
          const urlParams = new URLSearchParams(authWindow.location.href)
          accessToken = urlParams.get('access_token')
          code = urlParams.get('code')
        } catch (e) {
          // Ignore CORS error from popup
        }

        // The window has closed OR we have what we are looking for so we stop polling
        if (authWindow.closed || accessToken || code) {
          clearInterval(checkWindowClosed)
          authWindow.close()

          if (accessToken) {
            // State is a hash fragment and cannot be found through search params
            const _state = authWindow.location.href.match(/state=([^&]*)/)?.[1]
            if (accessToken && _state === state) {
              resolve(accessToken)
            }
          } else if (code && 'code' in flow) {
            console.log('tiger tiget tiger woods yall')
            console.log({ code })
            getAuthorizationCodeToken(flow, code)
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

/**
 * Used in the authflow when grabbing a token from the backend
 */
const getAuthorizationCodeToken = async (
  flow: SecuritySchemeOauth2['flows']['authorizationCode'],
  code: string,
) => {
  console.log(flow)
  console.log(code)
}
