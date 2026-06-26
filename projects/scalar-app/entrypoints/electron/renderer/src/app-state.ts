import { customFetch } from '@electron/helpers/custom-fetch/custom-fetch'
import { router } from '@electron/renderer/src/router'

import { createAppState } from '@/features/app'
import { readFiles } from '@/loaders/read-files'

/** Initialize the app state with router */
export const appState = await createAppState({
  router,
  fileLoader: readFiles(),
  telemetryDefault: true,
  layout: 'desktop',
  options: {
    customFetch,
    /**
     * Loopback redirect, per RFC 8252 section 7.3. The main process owns the
     * ephemeral port, so the value shown here is the port-agnostic origin users
     * register with their OAuth2 provider.
     */
    oauth2RedirectUri: 'http://127.0.0.1',
    /**
     * Desktop interactive OAuth2 cannot use browser-popup polling (the renderer
     * runs on `file://`). Instead, run authorization through the system browser
     * and capture the redirect on a loopback server in the main process.
     */
    captureOAuth2Callback: async ({ authorizationUrl }) => {
      const result = await window.api.authorizeOauth2({ authorizationUrl })
      return 'callbackUrl' in result
        ? [null, { callbackUrl: result.callbackUrl, redirectUri: result.redirectUri }]
        : [new Error(result.error), null]
    },
  },
})
