import { useToasts } from '@scalar/use-toasts'
import { coerce, string } from '@scalar/validation'
import { trackPageview } from 'fathom-client'

import { createAppRouter } from '@/features/app'
import { DEFAULT_TEAM_WORKSPACE_SLUG } from '@/features/app/app-state'
import { exchangeToken } from '@/helpers/auth/exchange-token'
import { queryClient } from '@/helpers/query-client'
import { scalarClient } from '@/helpers/scalar-client'
import { useAuth } from '@/hooks/use-auth'

/** Create the router for the web app */
export const router: ReturnType<typeof createAppRouter> = createAppRouter('web')

const { isLoggedIn, setTokens, tokenData } = useAuth()
const { toast } = useToasts()

/** Fetches (or returns cached) teams and resolves the current team slug from the JWT. */
const fetchCurrentTeamSlug = async (): Promise<string> => {
  const teamsData = await queryClient.fetchQuery({
    queryKey: ['teams'],
    queryFn: () => scalarClient.teams.listTeams(),
    meta: {
      errorMessage: 'Failed to fetch teams. Please try logging in again.',
    },
  })
  return teamsData?.teams?.find((t) => t.uid === tokenData.value?.teamUid)?.slug ?? 'local'
}

router.beforeEach(async (to) => {
  const parsedExchangeToken = coerce(string(), to.query.exchangeToken)

  // Login only if the user is not logged in and an exchange token is provided
  if (isLoggedIn.value !== true && parsedExchangeToken) {
    const [error, data] = await exchangeToken(parsedExchangeToken)

    if (error) {
      toast('Unable to login. Please try again or contact support.', 'error', {
        timeout: 10000,
      })
    } else {
      setTokens(data.accessToken, data.refreshToken)
      toast('Logged in successfully', 'info')

      try {
        const teamSlug = await fetchCurrentTeamSlug()
        if (teamSlug) {
          return {
            path: `/@${teamSlug}/${DEFAULT_TEAM_WORKSPACE_SLUG}/get-started`,
          }
        }
      } catch {
        // If fetching teams fails, fall through to strip the exchangeToken and continue navigation
      }
    }

    // Login failed — strip the exchange token and continue to the original route
    const { exchangeToken: _, ...query } = to.query
    return { ...to, query }
  }

  /** Hook into the router to track pageviews */
  if (typeof to.name === 'string') {
    trackPageview({
      // We don't need to know the path, the name of the route is enough.
      url: `https://scalar-web-app/${to.name}`,
    })
  }

  return undefined
})
