import { createAppRouter } from '@scalar/api-client/v2/features/app'
import { useToasts } from '@scalar/use-toasts'
import { coerce, string } from '@scalar/validation'
import { trackPageview } from 'fathom-client'

import { exchangeToken } from '@/helpers/auth/exchange-token'
import { useAuth } from '@/hooks/use-auth'

/** Create the router for the web app */
export const router: ReturnType<typeof createAppRouter> = createAppRouter('web')

const { isLoggedIn, setTokens } = useAuth()
const { toast } = useToasts()

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
    }

    // Update the router param query
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
