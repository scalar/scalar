import { createAppState } from '@scalar/api-client/v2/features/app'
import { router } from '@web/router'

import { useStateData } from '@/hooks/use-state-data'

const { currentTeam, customThemes, fallbackThemeSlug } = useStateData()

/** Initialize the app state with router */
export const appState = await createAppState({
  router,
  currentTeam,
  customThemes,
  fallbackThemeSlug,
  telemetryDefault: true,
})
