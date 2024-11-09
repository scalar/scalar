import type { createApiClient } from '@/libs'
import { inject } from 'vue'

/**
 * The layout of the client
 */
export type ClientLayout = 'modal' | 'web' | 'desktop'

/**
 * Get the current client layout
 *
 * @see {@link createApiClient}
 */
export const useLayout = () => ({
  layout: inject<ClientLayout>('layout') ?? 'desktop',
})
