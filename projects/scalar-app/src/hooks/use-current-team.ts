import { useToasts } from '@scalar/use-toasts'
import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import { computed, watch } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'
import { useCurrentUser } from '@/hooks/use-current-user'

/**
 * Fetches and caches the teams list, then derives the active team from the
 * current user's activeTeamId.
 *
 * Uses the ['teams'] query key shared with use-state-data.ts so both places
 * read from the same cache entry and only one network request is made.
 *
 * @returns The query result extended with a `currentTeam` computed ref.
 */
export const useCurrentTeam = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  const { isLoggedIn } = useAuth()
  const queryKey = ['teams'] satisfies QueryKey

  const { toast } = useToasts()
  const { user } = useCurrentUser()

  const query = useQuery(
    {
      queryKey,
      queryFn: () => scalarClient.teams.listTeams().then((response) => response.teams ?? []),
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
        toast('Failed to fetch teams', 'error')
      }
    },
  )

  return {
    ...query,
    team: computed(() => query.data.value?.find((t) => t.uid === user.value?.activeTeamId)),
  }
}
