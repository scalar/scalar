import { isObject } from '@scalar/helpers/object/is-object'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type { ConfigDefaults, PostHog } from 'posthog-js'
import ph from 'posthog-js'

import { sanitizeEventPayload } from './sanitize-event-payload'

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
      '*': (event: keyof ApiReferenceEvents, payload: ApiReferenceEvents[keyof ApiReferenceEvents]) => {
        // User logs in — never capture this event; identify only when payload is valid
        if (event === 'log:user-login') {
          if (isObject(payload) && 'uid' in payload && typeof payload.uid === 'string') {
            posthog?.identify(payload.uid, { email: payload.email, teamUid: payload.teamUid })
          }
          return
        }

        // User logs out
        if (event === 'log:user-logout') {
          posthog?.reset()
          return
        }

        // Only capture events that are in the allowlist
        const result = sanitizeEventPayload(event, payload)
        if (result !== null) {
          const properties = typeof result === 'object' && result !== null ? result : { value: result }
          posthog?.capture(event, properties)
        }
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
