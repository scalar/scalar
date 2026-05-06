import { Scalar } from '@scalar/sdk'

import { env } from '@/environment'
import { useAuth } from '@/hooks/use-auth'

const { getAccessToken, checkRefresh } = useAuth()

/**
 * Default refetch interval for scalar client
 *
 * 1 minute
 */
export const DEFAULT_REFETCH_INTERVAL = 1000 * 60

/** Single SDK client for the app */
export const scalarClient = new Scalar({
  serverURL: `${env.VITE_API_URL}`,
  bearerAuth: async () => {
    // Ensure the access token is fresh
    await checkRefresh()

    return getAccessToken() ?? ''
  },
})
