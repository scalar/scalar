import type { Theme } from '@scalar/themes'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type QueryKey, type UseQueryOptions, useQuery } from '@tanstack/vue-query'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

import { queryClient } from '@/helpers/query-client'
import { DEFAULT_REFETCH_INTERVAL, scalarClient } from '@/helpers/scalar-client'
import { getActiveThemeStyles } from '@/helpers/theme/get-active-theme-styles'
import { useAuth } from '@/hooks/use-auth'
import { useTeams } from '@/hooks/use-teams'
import { useUser } from '@/hooks/use-user'

/**
 * Fetches custom themes from the API and resolves the active theme CSS for the
 * current workspace.
 *
 * Combines data-fetching (custom themes list, user/team preference) with CSS
 * resolution so callers get a single, ready-to-use hook. The resolved theme
 * follows this priority:
 *
 *   1. Workspace theme (`store.workspace['x-scalar-theme']`)
 *   2. Fallback theme (user preference → team preference → `'default'`)
 *   3. Built-in `'default'` theme
 *
 * @example
 * ```ts
 * const { themeStyleTag, customThemes } = useThemes({ store: app.store })
 * ```
 */
export const useThemes = ({
  store,
  ...options
}: {
  /** The workspace store used to read the active theme slug */
  store: MaybeRefOrGetter<WorkspaceStore | null>
} & Omit<UseQueryOptions, 'queryKey' | 'queryFn'>): {
  /** The custom themes fetched from the API */
  customThemes: ComputedRef<Theme[]>
  /** The fallback theme slug derived from user/team preference */
  fallbackThemeSlug: ComputedRef<string>
  /** The resolved theme styles for the current workspace */
  themeStyles: ComputedRef<{ themeStyles: string; themeSlug: string }>
  /** A `<style>` tag string ready for DOM injection via `v-html` */
  themeStyleTag: ComputedRef<string>
} => {
  const { isLoggedIn } = useAuth()
  const queryKey = ['themes'] satisfies QueryKey

  const { currentUser } = useUser()
  const { currentTeam } = useTeams()

  // ---------------------------------------------------------------------------
  // Data fetching — custom themes from the API
  // ---------------------------------------------------------------------------
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
      meta: { errorMessage: 'Failed to load themes' },
      ...options,
    },
    queryClient,
  )

  /** The custom themes for the current user/team, fetched from the server */
  const customThemes = computed<Theme[]>(() => query.data.value ?? [])

  /** The fallback theme slug derived from user preference, then team preference, then 'default' */
  const fallbackThemeSlug = computed<string>(() => currentUser.value?.theme || currentTeam.value?.theme || 'default')

  // ---------------------------------------------------------------------------
  // CSS resolution — turns the active slug into injectable styles
  // ---------------------------------------------------------------------------
  const themeStyles = computed(() => {
    const storeValue = toValue(store)
    return getActiveThemeStyles(storeValue?.workspace['x-scalar-theme'], fallbackThemeSlug.value, customThemes.value)
  })

  /** A `<style>` tag wrapping the resolved CSS, ready for `v-html` injection */
  const themeStyleTag = computed<string>(
    () =>
      `<style id="scalar-theme" data-testid="${themeStyles.value.themeSlug}">${themeStyles.value.themeStyles}</style>`,
  )

  return {
    customThemes,
    fallbackThemeSlug,
    themeStyles,
    themeStyleTag,
  }
}
