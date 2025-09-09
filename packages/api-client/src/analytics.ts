import { analyticsFactory } from '@scalar/analytics-client'

import { type ClientLayout, useLayout } from '@/hooks'
import { analytics as appAnalytics } from '@/layouts/App'
import { analytics as webAnalytics } from '@/layouts/Web'

export function createAnalyticsClient() {
  return analyticsFactory('https://api.scalar.com', () => '')
}

export function useAnalyticsClient() {
  const { layout } = useLayout()

  const AnalyticsClientMapping: Record<ClientLayout, ReturnType<typeof analyticsFactory> | undefined> = {
    'desktop': appAnalytics,
    'web': webAnalytics,
    modal: undefined,
  }

  return AnalyticsClientMapping[layout]
}
