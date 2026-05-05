import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ConfigDefaults, PostHog } from 'posthog-js'
import ph from 'posthog-js'

import { ANALYTICS_EVENTS } from '@/plugins/posthog/analytics-events'

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
  // Tracks the previous telemetry state so onConfigChange only fires when it actually toggles
  let prevTelemetry: boolean | undefined = undefined

  return {
    on: {
      // ── Account ─────────────────────────────────────────────────────────────
      'analytics:on:login-click': () => posthog?.capture(ANALYTICS_EVENTS.LOGIN_CLICK),
      'analytics:on:register-click': () => posthog?.capture(ANALYTICS_EVENTS.REGISTER_CLICK),
      'analytics:on:user-login': ({ uid, email, teamUid }) => posthog?.identify(uid, { email, teamUid }),
      'analytics:on:user-logout': () => posthog?.reset(),

      // ── Auth ────────────────────────────────────────────────────────────────
      /** scope: 'document' | 'operation' — also fires OPERATION_AUTH_OVERRIDE when scoped to a specific endpoint */
      'auth:update:selected-security-schemes': ({ meta }) => {
        posthog?.capture(ANALYTICS_EVENTS.AUTH_SCHEME_SELECT, { scope: meta.type })
        if (meta.type === 'operation') {
          posthog?.capture(ANALYTICS_EVENTS.OPERATION_AUTH_OVERRIDE)
        }
      },
      /** Only fires for API key schemes — http/oauth2/openIdConnect secrets use different events */
      'auth:update:security-scheme-secrets': ({ payload }) => {
        if (payload.type === 'apiKey') {
          posthog?.capture(ANALYTICS_EVENTS.AUTH_API_KEY_SAVE)
        }
      },
      /** Only fires when a brand-new scope is being added, not on existing scope selection */
      'auth:update:selected-scopes': ({ newScopePayload }) => {
        if (newScopePayload) {
          posthog?.capture(ANALYTICS_EVENTS.AUTH_SCOPE_ADD)
        }
      },

      // ── Command Palette ─────────────────────────────────────────────────────
      'ui:open:command-palette': () => posthog?.capture(ANALYTICS_EVENTS.COMMAND_PALETTE_OPEN),

      // ── Cookies ─────────────────────────────────────────────────────────────
      /** scope: 'document' | 'workspace' — index === undefined means this is a new cookie, not an update */
      'cookie:upsert:cookie': ({ index, collectionType }) => {
        if (index === undefined) {
          posthog?.capture(ANALYTICS_EVENTS.COOKIE_CREATE, { scope: collectionType })
        }
      },
      /** scope: 'document' | 'workspace' */
      'cookie:delete:cookie': ({ collectionType }) =>
        posthog?.capture(ANALYTICS_EVENTS.COOKIE_DELETE, { scope: collectionType }),

      // ── Document ────────────────────────────────────────────────────────────
      'document:create:empty-document': () => posthog?.capture(ANALYTICS_EVENTS.DOCUMENT_CREATE),
      'document:delete:document': () => posthog?.capture(ANALYTICS_EVENTS.DOCUMENT_DELETE),
      /** Only fires when description specifically changes, not for title/version/contact updates */
      'document:update:info': (payload) => {
        if ('description' in payload) {
          posthog?.capture(ANALYTICS_EVENTS.DOCUMENT_DESCRIPTION_EDIT)
        }
      },
      'ui:download:document': ({ format }) => posthog?.capture(ANALYTICS_EVENTS.DOCUMENT_DOWNLOAD, { format }),

      // ── Environment ─────────────────────────────────────────────────────────
      'environment:upsert:environment': () => posthog?.capture(ANALYTICS_EVENTS.ENVIRONMENT_SAVE),
      'workspace:update:active-environment': () => posthog?.capture(ANALYTICS_EVENTS.ENVIRONMENT_SELECT),

      // ── Operation ───────────────────────────────────────────────────────────
      'hooks:on:request:sent': ({ meta }) =>
        posthog?.capture(ANALYTICS_EVENTS.REQUEST_SEND, { method: meta.method, path: meta.path }),
      'hooks:on:request:complete': ({ payload }) => {
        if (!payload) {
          return
        }
        posthog?.capture(payload.response.ok ? ANALYTICS_EVENTS.REQUEST_SUCCESS : ANALYTICS_EVENTS.REQUEST_FAIL, {
          status_code: payload.response.status,
        })
      },
      'operation:create:operation': () => posthog?.capture(ANALYTICS_EVENTS.OPERATION_CREATE),
      'operation:delete:operation': () => posthog?.capture(ANALYTICS_EVENTS.OPERATION_DELETE),
      'operation:update:pathMethod': ({ payload }) =>
        posthog?.capture(ANALYTICS_EVENTS.OPERATION_METHOD_CHANGE, { method: payload.method }),
      'operation:update:requestBody:contentType': ({ payload }) =>
        posthog?.capture(ANALYTICS_EVENTS.OPERATION_REQUEST_BODY_FILTER, { content_type: payload.contentType }),
      'operation:reload:history': () => posthog?.capture(ANALYTICS_EVENTS.OPERATION_HISTORY_SELECT),

      // ── Scripts ─────────────────────────────────────────────────────────────
      /** scope: 'operation' — fires for x-pre-request and x-post-response extension saves on an operation */
      'operation:update:extension': ({ payload }) => {
        const ext = payload as Record<string, unknown>
        if ('x-pre-request' in ext) {
          posthog?.capture(ANALYTICS_EVENTS.SCRIPT_PRE_REQUEST_SAVE, {
            scope: 'operation',
            is_empty: !ext['x-pre-request'],
          })
        }
        if ('x-post-response' in ext) {
          posthog?.capture(ANALYTICS_EVENTS.SCRIPT_POST_RESPONSE_SAVE, {
            scope: 'operation',
            is_empty: !ext['x-post-response'],
          })
        }
      },
      /** scope: 'document' — fires for x-pre-request and x-post-response extension saves at the document level */
      'document:update:extension': (payload) => {
        if ('x-pre-request' in payload) {
          posthog?.capture(ANALYTICS_EVENTS.SCRIPT_PRE_REQUEST_SAVE, {
            scope: 'document',
            is_empty: !payload['x-pre-request'],
          })
        }
        if ('x-post-response' in payload) {
          posthog?.capture(ANALYTICS_EVENTS.SCRIPT_POST_RESPONSE_SAVE, {
            scope: 'document',
            is_empty: !payload['x-post-response'],
          })
        }
      },

      // ── Search ──────────────────────────────────────────────────────────────
      'ui:focus:search': () => posthog?.capture(ANALYTICS_EVENTS.SEARCH_OPEN),

      // ── Server ──────────────────────────────────────────────────────────────
      /** scope: 'document' | 'operation' — also fires OPERATION_SERVER_OVERRIDE when scoped to a specific endpoint */
      'server:add:server': ({ meta }) => {
        posthog?.capture(ANALYTICS_EVENTS.SERVER_ADD)
        if (meta.type === 'operation') {
          posthog?.capture(ANALYTICS_EVENTS.OPERATION_SERVER_OVERRIDE)
        }
      },
      /** scope: 'document' | 'operation' */
      'server:update:selected': ({ meta }) => posthog?.capture(ANALYTICS_EVENTS.SERVER_SELECT, { scope: meta.type }),
      /** scope: 'document' | 'operation' */
      'server:update:variables': ({ meta }) =>
        posthog?.capture(ANALYTICS_EVENTS.SERVER_VARIABLE_UPDATE, { scope: meta.type }),

      // ── Settings ────────────────────────────────────────────────────────────
      // SETTINGS_TELEMETRY_CHANGE is tracked in lifecycle.onConfigChange below, not here
      'workspace:update:active-proxy': (proxy) =>
        posthog?.capture(ANALYTICS_EVENTS.SETTINGS_PROXY_CHANGE, { proxy_type: proxy ? 'scalar' : 'none' }),
      'workspace:update:color-mode': (mode) =>
        posthog?.capture(ANALYTICS_EVENTS.SETTINGS_COLOR_MODE_CHANGE, { color_mode: mode }),
      'workspace:update:theme': (theme) =>
        posthog?.capture(ANALYTICS_EVENTS.SETTINGS_THEME_CHANGE, { theme_slug: theme }),
      'document:update:watch-mode': (enabled) =>
        posthog?.capture(ANALYTICS_EVENTS.SETTINGS_WATCH_MODE_TOGGLE, { enabled }),

      // ── Snippets ────────────────────────────────────────────────────────────
      'workspace:update:selected-client': (client) =>
        posthog?.capture(ANALYTICS_EVENTS.SNIPPET_LANGUAGE_CHANGE, { client }),

      // ── Tag ─────────────────────────────────────────────────────────────────
      'tag:create:tag': () => posthog?.capture(ANALYTICS_EVENTS.TAG_CREATE),

      // ── UI / Misc ───────────────────────────────────────────────────────────
      'ui:open:client-modal': () => posthog?.capture(ANALYTICS_EVENTS.MODAL_OPEN),
      'copy-url:address-bar': () => posthog?.capture(ANALYTICS_EVENTS.OPERATION_URL_COPY),

      // ══════════════════════════════════════════════════════════════════════════════
      // NOT YET WIRED — requires new definition events added to workspace-store
      // ══════════════════════════════════════════════════════════════════════════════

      // Auth
      // AUTH_OAUTH_START       → needs 'auth:on:oauth-start'
      // AUTH_OAUTH_SUCCESS     → needs 'auth:on:oauth-success'
      // AUTH_OAUTH_FAIL        → needs 'auth:on:oauth-fail'
      // AUTH_OAUTH_REFRESH     → needs 'auth:on:oauth-refresh'
      // AUTH_OAUTH_FLOW_SELECT → needs 'auth:on:oauth-flow-select'
      // AUTH_SCHEME_TYPE_USE   → needs scheme type exposed in 'auth:update:selected-security-schemes' payload
      // AUTH_TOKEN_CLEAR       → needs 'auth:on:oauth-token-clear'; auth:clear:security-scheme-secrets removes the whole scheme, not just the token

      // Command Palette
      // COMMAND_PALETTE_COMMAND_SELECT → needs 'ui:execute:command-palette-command' (fires on execution, not just palette open)

      // Scripts
      // SCRIPT_PRE_REQUEST_EXECUTE  → needs 'hooks:on:pre-request:execute' (with { success })
      // SCRIPT_POST_RESPONSE_EXECUTE → needs 'hooks:on:post-response:execute' (with { test_count, pass_count, fail_count })

      // Snippets
      // SNIPPET_COPY → needs 'ui:copy:snippet' (with { client, language })

      // Document
      // DOCUMENT_IMPORT_URL      → needs 'document:import:url'
      // DOCUMENT_IMPORT_FILE     → needs 'document:import:file'
      // DOCUMENT_IMPORT_POSTMAN  → needs 'document:import:postman'
      // DOCUMENT_IMPORT_CURL     → needs 'document:import:curl'
      // DOCUMENT_DISCARD_CHANGES → needs 'document:discard:changes'
      // DOCUMENT_VERSION_SELECT  → needs 'document:select:version'
      // DOCUMENT_PULL            → needs 'document:pull:document'
      // DOCUMENT_PUSH            → needs 'document:push:document'

      // Environment
      // ENVIRONMENT_CREATE → needs 'environment:create:environment'; cannot distinguish create from upsert without external state

      // Operation
      // OPERATION_HISTORY_OPEN   → needs 'operation:open:history'
      // OPERATION_SERVER_EXTRACT → needs 'operation:extract:server' (URL pasted and auto-parsed into server + path)

      // Search
      // SEARCH_RESULT_SELECT → needs 'search:select:result'

      // Editor
      // EDITOR_OPEN             → needs 'editor:open:editor'
      // EDITOR_LANGUAGE_CHANGE  → needs 'editor:change:language'
      // EDITOR_SAVE             → needs 'editor:save:document'
      // EDITOR_AUTO_SAVE_TOGGLE → needs 'editor:toggle:auto-save'
      // EDITOR_FORMAT           → needs 'editor:format:document'
      // EDITOR_MAXIMIZE_TOGGLE  → needs 'editor:toggle:maximize'
      // EDITOR_DIAGNOSTICS      → needs 'editor:on:diagnostics' (with { error_count, warning_count })

      // Workspace
      // WORKSPACE_CREATE → needs 'workspace:create:workspace'
      // WORKSPACE_SWITCH → needs 'workspace:switch:workspace'
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

          const telemetry = context?.config.telemetry !== false
          prevTelemetry = telemetry

          if (telemetry) {
            posthog.opt_in_capturing()
          }
        }
      },
      onConfigChange(context) {
        if (!posthog) {
          return
        }

        const telemetry = context.config.telemetry !== false

        // Only act when the value actually changes to avoid redundant captures
        if (telemetry === prevTelemetry) {
          return
        }

        prevTelemetry = telemetry

        if (telemetry) {
          posthog.opt_in_capturing()
          posthog.capture(ANALYTICS_EVENTS.SETTINGS_TELEMETRY_CHANGE, { enabled: true })
        } else {
          // Capture before opting out so the final event is still sent
          posthog.capture(ANALYTICS_EVENTS.SETTINGS_TELEMETRY_CHANGE, { enabled: false })
          posthog.opt_out_capturing()
        }
      },
      onDestroy() {
        posthog?.reset()
        posthog = null
      },
    },
  }
}
