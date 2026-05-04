import { ANALYTICS_EVENTS } from '@scalar/helpers/general/analytics-events'
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
  /** The deployment environment (e.g. 'production', 'staging') */
  environment?: string
  /** Whether the app is running in Electron ('desktop') or browser ('web') */
  platform?: 'desktop' | 'web'
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
      'hooks:on:request:sent': () => posthog?.capture(ANALYTICS_EVENTS.REQUEST_SEND),
      'operation:create:operation': () => posthog?.capture(ANALYTICS_EVENTS.OPERATION_CREATE),
      'operation:delete:operation': () => posthog?.capture(ANALYTICS_EVENTS.OPERATION_DELETE),
      'document:create:empty-document': () => posthog?.capture(ANALYTICS_EVENTS.DOCUMENT_CREATE),
      'document:delete:document': () => posthog?.capture(ANALYTICS_EVENTS.DOCUMENT_DELETE),
      'tag:create:tag': () => posthog?.capture(ANALYTICS_EVENTS.TAG_CREATE),
      'server:add:server': () => posthog?.capture(ANALYTICS_EVENTS.SERVER_ADD),
      'auth:update:selected-security-schemes': () => posthog?.capture(ANALYTICS_EVENTS.AUTH_SCHEME_SELECT),
      'environment:upsert:environment': () => posthog?.capture(ANALYTICS_EVENTS.ENVIRONMENT_SAVE),
      'ui:open:client-modal': () => posthog?.capture(ANALYTICS_EVENTS.MODAL_OPEN),
      'ui:download:document': () => posthog?.capture(ANALYTICS_EVENTS.DOCUMENT_DOWNLOAD),
      'analytics:on:login-click': () => posthog?.capture(ANALYTICS_EVENTS.LOGIN_CLICK),
      'analytics:on:register-click': () => posthog?.capture(ANALYTICS_EVENTS.REGISTER_CLICK),

      // Auth events
      'analytics:on:user-login': ({ uid, email, teamUid }) =>
        posthog?.identify(uid, { email, teamUid }),
      'analytics:on:user-logout': () => posthog?.reset(),
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
          posthog.register({
            product: 'api-client',
            ...(config.platform ? { platform: config.platform } : {}),
            ...(config.environment ? { environment: config.environment } : {}),
          })

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
