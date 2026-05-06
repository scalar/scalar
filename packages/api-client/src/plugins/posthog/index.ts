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
 * Extracts a safe, flat set of analytics properties from a raw event payload.
 *
 * Only a known whitelist of fields is forwarded to PostHog — no PII, no
 * request bodies, no auth secrets. Nested values are accessed defensively
 * so any event shape that does not carry a given field simply omits it.
 */
const extractProperties = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const p = payload as Record<string, unknown>
  const properties: Record<string, unknown> = {}

  // collectionType: 'document' | 'workspace'
  if (typeof p['collectionType'] === 'string') {
    properties['collectionType'] = p['collectionType']
  }

  // format: e.g. 'json' | 'yaml' on ui:download:document
  if (typeof p['format'] === 'string') {
    properties['format'] = p['format']
  }

  // contentType: content-type string on requestBody events
  if (typeof p['contentType'] === 'string') {
    properties['contentType'] = p['contentType']
  }

  // meta.type: 'document' | 'operation' on auth events
  const meta = p['meta']
  if (meta && typeof meta === 'object') {
    const metaType = (meta as Record<string, unknown>)['type']
    if (typeof metaType === 'string') {
      properties['meta.type'] = metaType
    }
  }

  // payload.type: scheme type on auth:update:security-scheme events
  const innerPayload = p['payload']
  if (innerPayload && typeof innerPayload === 'object') {
    const payloadType = (innerPayload as Record<string, unknown>)['type']
    if (typeof payloadType === 'string') {
      properties['payload.type'] = payloadType
    }

    // payload.contentType: content type on requestBody:contentType events
    const payloadContentType = (innerPayload as Record<string, unknown>)['contentType']
    if (typeof payloadContentType === 'string') {
      properties['payload.contentType'] = payloadContentType
    }
  }

  return properties
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
      '*': (event, payload) => {
        // User logged in lets register with posthog
        if (event === 'log:user-login') {
          posthog?.identify(payload.uid, { email: payload.email, teamUid: payload.teamUid })
          return
        }

        // User is logging out
        if (event === 'log:user-logout') {
          posthog?.reset()
          return
        }

        posthog?.capture(String(event), extractProperties(payload))
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
