import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type { ConfigDefaults, PostHog } from 'posthog-js'
import ph from 'posthog-js'

import { sanitizePayload } from './sanitize-payload'

export type PostHogConfig = {
  /** Your PostHog project API key */
  apiKey: string
  /** The PostHog API host URL */
  apiHost: string
  /** The PostHog UI host URL (for session recordings, surveys, etc.) */
  uiHost?: string
  /** PostHog defaults version identifier */
  defaults?: ConfigDefaults
}

/**
 * PostHog analytics plugin for the API Client.
 *
 * Loading this plugin opts in to analytics. If the plugin is not loaded,
 * no tracking occurs.
 *
 * Respects the `telemetry` configuration option — when set to `false`,
 * capturing is disabled. Reacts dynamically to config changes at runtime.
 */
export const PostHogClientPlugin = (config: PostHogConfig): ClientPlugin => {
  let posthog: PostHog | null = null

  return {
    on: {
      'log:user-login': ({ uid, email, teamUid }) => {
        posthog?.identify(uid, { email, teamUid })
      },
      'log:user-logout': () => {
        posthog?.reset()
      },
      '*': (event: keyof ApiReferenceEvents, payload: ApiReferenceEvents[keyof ApiReferenceEvents]) => {
        // We dont want to duplciate any events from above
        if (event === 'log:user-login' || event === 'log:user-logout') {
          return
        }
        posthog?.capture(event, sanitizePayload(payload))
      },
    },
    lifecycle: {
      onInit(context) {
        if (typeof window === 'undefined') {
          return
        }

        const instance = ph.init(
          config.apiKey,
          {
            api_host: config.apiHost,
            ...(config.uiHost ? { ui_host: config.uiHost } : {}),
            ...(config.defaults ? { defaults: config.defaults } : {}),
            opt_out_capturing_by_default: true,
          },
          'scalar-api-client',
        )

        if (instance) {
          posthog = instance
          posthog.register({ product: 'api-client' })

          if (context?.config.telemetry !== false) {
            posthog.opt_in_capturing()
          }
        }
      },
      onConfigChange(context) {
        if (!posthog) {
          return
        }

        if (context.config.telemetry === false) {
          posthog.opt_out_capturing()
        } else {
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
