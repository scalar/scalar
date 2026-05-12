import type { Team } from '@scalar/sdk/models/components'
import { useToasts } from '@scalar/use-toasts'
import { ref, watch } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

/**
 * A hook to manage the state for the createAppState function
 *
 * @deprecated we can remove this once we move everything to this project
 *
 * We cannot use useQuery here because this hook is called outside of a
 * component setup context.
 *
 * All SDK calls are routed through the shared queryClient so they populate
 * the cache. Other hooks that use the same query keys (e.g. useCurrentUser
 * uses ['me']) will read from cache and avoid duplicate network requests.
 */
export const useStateData = () => {
  const currentTeam = ref<Team | undefined>(undefined)

  /**
   * Tracks whether we are currently performing the *initial* fetch of the
   * user/teams payload that resolves `currentTeam`. App state consumers gate
   * route handling and the splash screen on this so a reload onto a team
   * workspace URL does not bounce the user back to the local default before
   * the team data has had a chance to populate.
   *
   * Stays `false` for subsequent background token refreshes (focus /
   * visibilitychange driven). The watcher below still re-fetches the user
   * and teams to keep the cache fresh, but we deliberately do not re-raise
   * this flag - flipping it back to `true` would put the splash screen back
   * over an already-mounted workspace and short-circuit `handleRouteChange`
   * for an active session.
   */
  const isCurrentTeamLoading = ref(false)

  const { getAccessToken } = useAuth()
  const { toast } = useToasts()

  watch(
    getAccessToken,
    (accessToken, previousAccessToken) => {
      currentTeam.value = undefined
      isCurrentTeamLoading.value = false

      if (!accessToken) {
        currentTeam.value = undefined
        return
      }

      // Only gate the UI on the *first* authenticated fetch for this
      // session. The watcher fires on initial load (previousAccessToken is
      // undefined), on fresh login (previousAccessToken is null), and on
      // every background token refresh (previousAccessToken is the prior
      // token string). Splash + route deferral must only apply to the
      // first two; refreshes are silent revalidations.
      if (!previousAccessToken) {
        isCurrentTeamLoading.value = true
      }

      // ['me'] matches the query key in use-current-user.ts so both hooks
      // share a single network request via the queryClient cache.
      Promise.all([
        queryClient.fetchQuery({
          queryKey: ['me'],
          queryFn: () => scalarClient.authentication.getCurrentUser().then((response) => response.user ?? null),
          staleTime: DEFAULT_REFETCH_INTERVAL,
        }),
        queryClient.fetchQuery({
          queryKey: ['teams'],
          queryFn: () => scalarClient.teams.listTeams().then((response) => response.teams ?? []),
          staleTime: DEFAULT_REFETCH_INTERVAL,
        }),
      ])
        .then(([user, teams]) => {
          currentTeam.value = teams.find((t) => t.uid === user?.activeTeamId) ?? undefined
        })
        .catch(() => toast('Failed to load user data', 'error'))
        .finally(() => {
          isCurrentTeamLoading.value = false
        })
    },
    { immediate: true },
  )

  return {
    currentTeam,
    isCurrentTeamLoading,
  }
}
