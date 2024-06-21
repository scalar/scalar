import type { SecuritySchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'
import type { ValueOf } from 'type-fest'

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
  flow: ValueOf<SecuritySchemeOauth2['flows']>,
  activeScheme: SecuritySchemeOauth2,
) =>
  new Promise<string>((resolve, reject) => {
    if (!flow) return

    const scopes = flow.selectedScopes.join(' ')
    const state = (Math.random() + 1).toString(36).substring(7)
    const url = new URL(
      'authorizationUrl' in flow ? flow.authorizationUrl : flow.tokenUrl,
    )

    url.searchParams.set('response_type', 'token')
    url.searchParams.set('client_id', activeScheme.clientId)
    url.searchParams.set('redirect_uri', window.location.href)
    url.searchParams.set('scope', scopes)
    url.searchParams.set('state', state)

    const windowFeatures = 'left=100,top=100,width=800,height=600'
    const authWindow = window.open(url, 'openAuth2Window', windowFeatures)

    if (authWindow) {
      const checkWindowClosed = setInterval(function () {
        let accessToken: string | null = null
        try {
          const urlParams = new URLSearchParams(authWindow.location.href)
          accessToken = urlParams.get('access_token')
        } catch (e) {
          // Ignore CORS error from popup
        }

        // The window has closed so we stop polling
        if (authWindow.closed || accessToken) {
          clearInterval(checkWindowClosed)

          if (accessToken) {
            // State is a hash fragment and cannot be found through search params
            const _state = authWindow.location.href.match(/state=([^&]*)/)?.[1]
            if (accessToken && _state === state) {
              resolve(accessToken)
            }
            authWindow.close()
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
