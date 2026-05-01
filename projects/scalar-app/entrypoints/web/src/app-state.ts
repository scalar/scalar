import { router } from '@web/router'

import { createAppState } from '@scalar/api-client/v2/features/app'

import { useStateData } from '@/hooks/use-state-data'

const { customThemes, fallbackThemeSlug } = useStateData()

/** Initialize the app state with router */
export const appState = await createAppState({
  router,
  customThemes,
  fallbackThemeSlug,
  telemetryDefault: true,
})
