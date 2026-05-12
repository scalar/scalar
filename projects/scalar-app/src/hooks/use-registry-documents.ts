import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

import { useTeams } from './use-teams'

/**
 * Fetches and caches API documents from the Scalar registry for your current team
 *
 * @returns The query result extended with a `documents` computed ref (defaults to `[]`).
 */
export const useRegistryDocuments = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  const { isLoggedIn } = useAuth()
  const { currentTeamSlug } = useTeams()
  const queryKey = ['documents', currentTeamSlug] satisfies QueryKey

  const query = useQuery(
    {
      queryKey,
      queryFn: () => scalarClient.registry.listAllApiDocuments().then((response) => response.apiDocuments ?? []),
      enabled: isLoggedIn,
      refetchOnMount: true,
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      meta: { errorMessage: 'Failed to fetch documents' },
      ...options,
    },
    queryClient,
  )

  return {
    ...query,
    documents: computed(() => {
      return query.data.value ?? []
    }),
  }
}
