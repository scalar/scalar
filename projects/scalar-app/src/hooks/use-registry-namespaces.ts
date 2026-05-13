import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

import { useTeams } from './use-teams'

/**
 * Fetches and caches the namespaces the current team can publish into.
 *
 * The list mirrors what the API client's publish modal needs: a stable
 * identifier per namespace, used both as the value sent back when the user
 * confirms and as the label shown next to the slug input.
 *
 * @returns The query result extended with a `namespaces` computed ref
 * (defaults to `[]`).
 */
export const useRegistryNamespaces = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  const { isLoggedIn } = useAuth()
  const { currentTeamSlug } = useTeams()
  const queryKey = ['namespaces', currentTeamSlug] satisfies QueryKey

  const query = useQuery(
    {
      queryKey,
      queryFn: () => scalarClient.namespaces.listNamespaces().then((response) => response.strings ?? []),
      enabled: isLoggedIn,
      refetchOnMount: true,
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      meta: { errorMessage: 'Failed to fetch namespaces' },
      ...options,
    },
    queryClient,
  )

  return {
    ...query,
    namespaces: computed(() => query.data.value ?? []),
  }
}
