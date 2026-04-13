import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { PostHog } from 'posthog-js'
import ph from 'posthog-js'

const POSTHOG_API_KEY = 'phc_3elIjSOvGOo5aEwg6krzIY9IcQiRubsBtglOXsQ4Uu4'

/**
 * PostHog analytics plugin for the API Client.
 *
 * Loading this plugin opts in to analytics. If the plugin is not loaded,
 * no tracking occurs.
 */
export const PostHogClientPlugin = (): ClientPlugin => {
  let posthog: PostHog | null = null

  return {
    lifecycle: {
      onInit() {
        if (typeof window === 'undefined') {
          return
        }

        const instance = ph.init(
          POSTHOG_API_KEY,
          {
            api_host: 'https://magic.scalar.com',
            ui_host: 'https://us.posthog.com',
            defaults: '2025-11-30',
            opt_out_capturing_by_default: true,
          },
          'scalar-api-client',
        )

        if (instance) {
          posthog = instance
          posthog.register({ product: 'api-client' })
          posthog.opt_in_capturing()
        }
      },
      onDestroy() {
        posthog?.reset()
        posthog = null
      },
    },
  }
}
