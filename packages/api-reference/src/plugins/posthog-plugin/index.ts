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
 *
 * Telemetry state is controlled by the parent API Reference plugin
 * via the shared `isTelemetryEnabled` callback.
 */
const createPostHogClientPlugin = (config: PostHogConfig, isTelemetryEnabled: () => boolean): ClientPlugin => {
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

          if (isTelemetryEnabled()) {
            posthog.opt_in_capturing()
          }
        }
      },
      onConfigChange(context) {
        if (!posthog) {
          return
        }

        if (context?.config.telemetry === false) {
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

/**
 * PostHog analytics plugin for the API Reference.
 *
 * Loading this plugin opts in to analytics for both the API Reference
 * and the embedded API Client (tracked as separate products).
 *
 * Respects the `telemetry` configuration option — when set to `false`,
 * capturing is disabled. Reacts dynamically to config changes at runtime.
 *
 * If the plugin is not loaded, no tracking occurs.
 */
export const PostHogPlugin = (config: PostHogConfig): ApiReferencePlugin => {
  let posthog: PostHog | null = null
  let telemetryEnabled = true

  return () => ({
    name: 'posthog',
    extensions: [],
    apiClientPlugins: [createPostHogClientPlugin(config, () => telemetryEnabled)],
    hooks: {
      onInit({ config: referenceConfig }) {
        telemetryEnabled = referenceConfig.telemetry !== false

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

          if (telemetryEnabled) {
            posthog.opt_in_capturing()
          }
        }
      },
      onConfigChange({ config: referenceConfig }) {
        telemetryEnabled = referenceConfig.telemetry !== false

        if (!posthog) {
          return
        }

        if (telemetryEnabled) {
          posthog.opt_in_capturing()
        } else {
          posthog.opt_out_capturing()
        }
      },
      onDestroy() {
        posthog?.reset()
        posthog = null
      },
    },
  })
}
