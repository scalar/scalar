import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ConfigDefaults, PostHog } from 'posthog-js'
import ph from 'posthog-js'

import type { ApiReferencePlugin } from '../plugin-manager'

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
 * Creates a PostHog client plugin for the embedded API client.
 * Tracks as a separate product ('api-client').
 */
const createPostHogClientPlugin = (config: PostHogConfig): ClientPlugin => {
  let posthog: PostHog | null = null

  return {
    lifecycle: {
      onInit() {
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

/**
 * PostHog analytics plugin for the API Reference.
 *
 * Loading this plugin opts in to analytics for both the API Reference
 * and the embedded API Client (tracked as separate products).
 *
 * If the plugin is not loaded, no tracking occurs.
 */
export const PostHogPlugin = (config: PostHogConfig): ApiReferencePlugin => {
  let posthog: PostHog | null = null

  return () => ({
    name: 'posthog',
    extensions: [],
    apiClientPlugins: [createPostHogClientPlugin(config)],
    hooks: {
      onInit() {
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
          'scalar-api-reference',
        )

        if (instance) {
          posthog = instance
          posthog.register({ product: 'api-reference' })
          posthog.opt_in_capturing()
        }
      },
      onDestroy() {
        posthog?.reset()
        posthog = null
      },
    },
  })
}
