import { router } from '@web/router'

import { createAppState } from '@/features/app'
import { useStateData } from '@/hooks/use-state-data'

const { currentTeam, customThemes, fallbackThemeSlug, isCurrentTeamLoading } = useStateData()

/** Initialize the app state with router */
export const appState = await createAppState({
  router,
  currentTeam,
  isCurrentTeamLoading,
  customThemes,
  fallbackThemeSlug,
  telemetryDefault: true,
})
