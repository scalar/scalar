import { customFetch } from '@electron/helpers/custom-fetch/custom-fetch'
import { router } from '@electron/renderer/src/router'
import { createAppState } from '@scalar/api-client/v2/features/app'

import { useStateData } from '@/hooks/use-state-data'
import { readFiles } from '@/loaders/read-files'

const { currentTeam, customThemes, fallbackThemeSlug } = useStateData()

/** Initialize the app state with router */
export const appState = await createAppState({
  router,
  customThemes,
  currentTeam,
  fallbackThemeSlug,
  fileLoader: readFiles(),
  telemetryDefault: true,
  options: {
    customFetch,
  },
})
