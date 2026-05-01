import { ref, watch } from 'vue'

import type { Theme } from '@scalar/themes'
import { useToasts } from '@scalar/use-toasts'

import { scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

/**
 * A simple hook to grab data for the app-state creation
 *
 * We cannot use useQuery out there so we need this hook
 */
export const useStateData = () => {
  const customThemes = ref<Theme[]>([])
  const fallbackThemeSlug = ref<string>('default')

  const { getAccessToken } = useAuth()
  const { toast } = useToasts()

  watch(
    getAccessToken,
    (accessToken) => {
      if (!accessToken) {
        return
      }

      // Gather all the theme uids and fetch every theme
      scalarClient.themes
        .listThemes()
        .then((themes) => {
          Promise.all(
            themes.map((t) => {
              return scalarClient.themes.getTheme({ slug: t.slug })
            }),
          )
            .then((_themes) => {
              customThemes.value = themes.map((theme, i) => ({
                ...theme,
                theme: _themes[i],
              }))
            })
            .catch(() => toast('Failed to load themes', 'error'))
        })
        .catch(() => toast('Failed to load themes', 'error'))

      Promise.all([
        scalarClient.authentication.getCurrentUser(),
        scalarClient.teams.listTeams(),
      ])
        .then(([user, teams]) => {
          const currentTeam = teams.find((t) => t.uid === user.activeTeamId)
          // @ts-expect-error - this will work when the SDK gets updated to the newest code
          fallbackThemeSlug.value =
            user.theme || currentTeam?.theme || 'default'
        })
        .catch(() => toast('Failed to load user data', 'error'))
    },
    { immediate: true },
  )

  return {
    customThemes,
    fallbackThemeSlug,
  }
}
