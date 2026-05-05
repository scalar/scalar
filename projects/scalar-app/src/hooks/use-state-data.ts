import type { Team } from '@scalar/sdk/models/components'
import type { Theme } from '@scalar/themes'
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
  const customThemes = ref<Theme[]>([])
  const fallbackThemeSlug = ref<string>('default')
  const currentTeam = ref<Team | undefined>(undefined)

  const { getAccessToken } = useAuth()
  const { toast } = useToasts()

  watch(
    getAccessToken,
    (accessToken) => {
      if (!accessToken) {
        currentTeam.value = undefined
        customThemes.value = []
        fallbackThemeSlug.value = 'default'
        return
      }

      // Fetch all themes and pre-fill the per-theme query cache entries so
      // any useQuery(['themes', slug]) call elsewhere reads from cache.
      queryClient
        .fetchQuery({
          queryKey: ['themes'],
          queryFn: () => scalarClient.themes.listThemes().then((response) => response.themes ?? []),
          staleTime: DEFAULT_REFETCH_INTERVAL,
        })
        .then((themes) => {
          Promise.all(
            themes.map((t) =>
              queryClient.fetchQuery({
                queryKey: ['themes', t.slug],
                queryFn: () => scalarClient.themes.getTheme({ slug: t.slug }).then((response) => response.res ?? ''),
                staleTime: DEFAULT_REFETCH_INTERVAL,
              }),
            ),
          )
            .then((_themes) => {
              customThemes.value = themes.map((theme, i) => ({
                ...theme,
                theme: _themes[i]!,
              }))
            })
            .catch(() => toast('Failed to load themes', 'error'))
        })
        .catch(() => toast('Failed to load themes', 'error'))

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
          fallbackThemeSlug.value = user?.theme || 'default'
        })
        .catch(() => toast('Failed to load user data', 'error'))
    },
    { immediate: true },
  )

  return {
    customThemes,
    currentTeam,
    fallbackThemeSlug,
  }
}
