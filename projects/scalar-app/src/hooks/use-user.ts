import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

/**
 * Fetches and caches the current user
 *
 * We refetch any time the token changes
 *
 * @returns The query result extended with a `user` computed ref (defaults to `null`).
 */
export const useUser = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  const { isLoggedIn, accessToken } = useAuth()
  const queryKey = ['me', accessToken] satisfies QueryKey

  const query = useQuery(
    {
      queryKey,
      queryFn: () => scalarClient.authentication.getCurrentUser(),
      enabled: isLoggedIn,
      meta: { errorMessage: 'Failed to fetch user' },
      ...options,
    },
    queryClient,
  )

  return {
    ...query,
    currentUser: computed(() => query.data.value?.user ?? undefined),
  }
}
