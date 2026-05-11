import { router } from '@web/router'

import { createAppState } from '@/features/app'

/** Initialize the app state with router */
export const appState = await createAppState({
  router,
  telemetryDefault: true,
})
