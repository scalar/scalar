import { PostHogClientPlugin, type PostHogConfig } from '@scalar/api-client/plugins/posthog'
import type { PostHog } from 'posthog-js'
import ph from 'posthog-js'

import type { ApiReferencePlugin } from '../plugin-manager'

export type { PostHogConfig }

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
  const clientPlugin = PostHogClientPlugin(config)

  return () => ({
    name: 'posthog',
    extensions: [],
    apiClientPlugins: [clientPlugin],
    hooks: {
      onInit({ config: referenceConfig }) {
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

          if (referenceConfig.telemetry !== false) {
            posthog.opt_in_capturing()
          }
        }

        clientPlugin.lifecycle?.onInit?.({ config: referenceConfig })
      },
      onConfigChange({ config: referenceConfig }) {
        if (posthog) {
          if (referenceConfig.telemetry === false) {
            posthog.opt_out_capturing()
          } else {
            posthog.opt_in_capturing()
          }
        }

        clientPlugin.lifecycle?.onConfigChange?.({ config: referenceConfig })
      },
      onDestroy() {
        posthog?.reset()
        posthog = null

        clientPlugin.lifecycle?.onDestroy?.()
      },
    },
  })
}
