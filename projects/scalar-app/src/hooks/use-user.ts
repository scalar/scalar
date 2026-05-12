import { useToasts } from '@scalar/use-toasts'
import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import { computed, watch } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

/**
 * Fetches and caches the current user
 *
 * @returns The query result extended with a `user` computed ref (defaults to `null`).
 */
export const useUser = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  const { isLoggedIn } = useAuth()
  const queryKey = ['me'] satisfies QueryKey

  // Set some defaults
  const { toast } = useToasts()

  const query = useQuery(
    {
      queryKey,
      queryFn: () => scalarClient.authentication.getCurrentUser(),
      enabled: isLoggedIn,
      refetchOnMount: true,
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      ...options,
    },
    queryClient,
  )

  watch(
    () => query.error.value,
    (error) => {
      if (error) {
        toast('Failed to fetch user', 'error')
      }
    },
  )

  return {
    ...query,
    currentUser: computed(() => query.data.value?.user ?? undefined),
  }
}
