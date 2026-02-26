import type { Workspace } from '@scalar/workspace-store/schemas'

import type { ClientLayout } from '@/v2/types/layout'

/**
 * Returns the default proxy URL for web layout.
 * For the 'web' layout, this ensures requests use Scalar's hosted proxy unless overridden,
 * which is important for browser environments with CORS or network restrictions.
 * For 'desktop' or 'modal' layouts, returns null to indicate no proxy by default.
 */
export const getDefaultProxyUrl = (layout: ClientLayout) => {
  if (layout === 'web') {
    return 'https://proxy.scalar.com'
  }
  return null
}

/**
 * Returns the active proxy URL for the workspace.
 *
 * Logic:
 * - If the active proxy url is not set, use the default proxy url.
 * - Otherwise, use the active proxy url.
 */
export const getActiveProxyUrl = (activeProxyUrl: Workspace['x-scalar-active-proxy'], layout: ClientLayout) => {
  // If the active proxy url is not set, use the default proxy url
  if (activeProxyUrl === undefined) {
    return getDefaultProxyUrl(layout)
  }
  return activeProxyUrl
}
