import { analyticsFactory } from '@scalar/analytics-client'

import { type ClientLayout, useLayout } from '@/hooks'
import { useClientConfig } from '@/hooks/useClientConfig'
import { analytics as appAnalytics } from '@/layouts/App'
import { analytics as webAnalytics } from '@/layouts/Web'

/** Centralized method to control creation of analytics clients.  */
export function createAnalyticsClient() {
  return analyticsFactory(
    'https://api.scalar.com',
    () => null, // There is no auth to return.
  )
}

/** Gets the correct analytics client based on the layout. */
export function useAnalytics() {
  const { layout } = useLayout()
  const config = useClientConfig()

  if (!config.value.telemetry) {
    return
  }

  // Create layout -> client mapping
  const AnalyticsMapping: Record<ClientLayout, ReturnType<typeof analyticsFactory> | undefined> = {
    'desktop': appAnalytics,
    'web': webAnalytics,
    modal: undefined, // There are currently no analytics for the modal layout.
  }

  // Return the correct analytics client
  return AnalyticsMapping[layout]
}
