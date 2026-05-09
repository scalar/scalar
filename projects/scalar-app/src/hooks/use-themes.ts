import type { Theme } from '@scalar/themes'
import { useToasts } from '@scalar/use-toasts'
import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import type { ComputedRef } from 'vue'
import { computed, watch } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'
import { useTeams } from '@/hooks/use-teams'
import { useUsers } from '@/hooks/use-users'

/**
 * Fetches the list of custom themes and their CSS bodies, returning a reactive
 * `customThemes` array and a `fallbackThemeSlug` derived from the current
 * user's or team's theme preference.
 *
 * Replaces the manual `queryClient.fetchQuery` theme-fetching logic that
 * previously lived in `use-state-data.ts`.
 */
export const useThemes = (
  options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>,
): {
  customThemes: ComputedRef<Theme[]>
  fallbackThemeSlug: ComputedRef<string>
} => {
  const { isLoggedIn } = useAuth()
  const queryKey = ['themes'] satisfies QueryKey

  const { toast } = useToasts()
  const { currentUser } = useUsers()
  const { currentTeam } = useTeams()

  const query = useQuery(
    {
      queryKey,
      queryFn: async (): Promise<Theme[]> => {
        const response = await scalarClient.themes.listThemes()
        const themes = response.themes ?? []

        const bodies: string[] = await Promise.all(
          themes.map((t: { slug: string }) =>
            queryClient.fetchQuery<string>({
              queryKey: ['themes', t.slug],
              queryFn: () => scalarClient.themes.getTheme({ slug: t.slug }).then((r) => r.res ?? ''),
              staleTime: DEFAULT_REFETCH_INTERVAL,
            }),
          ),
        )

        return themes.map(
          (theme, i: number): Theme => ({
            ...theme,
            theme: bodies[i]!,
          }),
        )
      },
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
        toast('Failed to load themes', 'error')
      }
    },
  )

  /** The custom themes for the current user/team, fetched from the server */
  const customThemes = computed<Theme[]>(() => query.data.value ?? [])

  /** The fallback theme slug to use when no custom theme is available */
  const fallbackThemeSlug = computed<string>(() => currentUser.value?.theme || currentTeam.value?.theme || 'default')

  return {
    customThemes,
    fallbackThemeSlug,
  }
}
