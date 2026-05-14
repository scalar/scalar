import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

/**
 * Fetches and caches the teams list, then derives the active team from the
 * current user's activeTeamId. Also provides the current team.
 *
 * Uses the ['teams'] query key shared with use-state-data.ts so both places
 * read from the same cache entry and only one network request is made.
 *
 * @returns The query result extended with a `currentTeam` computed ref.
 */
export const useTeams = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  const { isLoggedIn, tokenData } = useAuth()
  const queryKey = ['teams'] satisfies QueryKey

  const query = useQuery(
    {
      queryKey,
      queryFn: () => scalarClient.teams.listTeams(),
      enabled: isLoggedIn,
      refetchOnMount: true,
      refetchInterval: DEFAULT_REFETCH_INTERVAL,
      meta: { errorMessage: 'Failed to fetch teams' },
      ...options,
    },
    queryClient,
  )

  const teams = computed(() => query.data.value?.teams)
  const currentTeam = computed(() => query.data.value?.teams?.find((t) => t.uid === tokenData.value?.teamUid))
  const currentTeamSlug = computed(() => currentTeam.value?.slug || 'local')
  /**
   * Stable identifier for the active team. Use this instead of the slug
   * when persisting or looking up team-owned data — slugs are mutable on
   * the server, the UID is not.
   */
  const currentTeamUid = computed(() => currentTeam.value?.uid || 'local')

  return {
    ...query,
    teams,
    currentTeam,
    currentTeamSlug,
    currentTeamUid,
  }
}
