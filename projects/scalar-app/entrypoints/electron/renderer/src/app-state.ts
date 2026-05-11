import { customFetch } from '@electron/helpers/custom-fetch/custom-fetch'
import { router } from '@electron/renderer/src/router'

import { createAppState } from '@/features/app'
import { readFiles } from '@/loaders/read-files'

/** Initialize the app state with router */
export const appState = await createAppState({
  router,
  fileLoader: readFiles(),
  telemetryDefault: true,
  options: {
    customFetch,
    oauth2RedirectUri: '',
  },
})
