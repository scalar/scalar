import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ConfigDefaults, PostHog } from 'posthog-js'
import ph from 'posthog-js'

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
      'hooks:on:request:sent': () => posthog?.capture('hooks:on:request:sent'),
      'operation:create:operation': () => posthog?.capture('operation:create:operation'),
      'operation:delete:operation': () => posthog?.capture('operation:delete:operation'),
      'document:create:empty-document': () => posthog?.capture('document:create:empty-document'),
      'document:delete:document': () => posthog?.capture('document:delete:document'),
      'tag:create:tag': () => posthog?.capture('tag:create:tag'),
      'server:add:server': () => posthog?.capture('server:add:server'),
      'auth:update:selected-security-schemes': () => posthog?.capture('auth:update:selected-security-schemes'),
      'environment:upsert:environment': () => posthog?.capture('environment:upsert:environment'),
      'ui:open:client-modal': () => posthog?.capture('ui:open:client-modal'),
      'ui:download:document': () => posthog?.capture('ui:download:document'),
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
