import type { ClientLayout } from '@/libs'
import { inject } from 'vue'

/**
 * Get the current client layout
 *
 * @see {@link ClientLayout}
 */
export const useLayout = () => ({
  layout: inject<ClientLayout>('layout') ?? 'desktop',
})
