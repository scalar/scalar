import { analytics } from '@/analytics'
import { useClientConfig } from '@/hooks/useClientConfig'
import { useLayout } from '@/hooks/useLayout'

/** Gets the correct analytics client based on the layout. */
export function useAnalytics() {
  const { layout } = useLayout()
  const config = useClientConfig()

  if (!config.value.telemetry || layout === 'modal') {
    return
  }

  // Return the correct analytics client
  return analytics
}
