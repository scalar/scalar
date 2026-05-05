/**
 * Centralized dictionary of PostHog analytics event names.
 *
 * Naming convention follows PostHog best practices:
 * - Format: `category:object_action`
 * - snake_case throughout
 * - Present-tense verbs (click, create, delete, send, open, add, select, download)
 *
 * The category is the entity or domain the event belongs to, not the product
 * it originates from. This makes events reusable across products.
 *
 * @see https://posthog.com/docs/product-analytics/best-practices
 */
export const ANALYTICS_EVENTS = {
  // --------------------------------------------------
  // Account
  // --------------------------------------------------

  /** User clicked a login button */
  LOGIN_CLICK: 'account:login_click',
  /** User clicked the register button */
  REGISTER_CLICK: 'account:register_click',

  // --------------------------------------------------
  // Auth
  // --------------------------------------------------

  /** User selected an auth security scheme */
  AUTH_SCHEME_SELECT: 'auth:scheme_select',
  /** User saved an API key */
  AUTH_API_KEY_SAVE: 'auth:api_key_save',
  /** User initiated an OAuth authorization flow */
  AUTH_OAUTH_START: 'auth:oauth_start',
  /** OAuth authorization completed successfully */
  AUTH_OAUTH_SUCCESS: 'auth:oauth_success',
  /** OAuth authorization failed */
  AUTH_OAUTH_FAIL: 'auth:oauth_fail',
  /** OAuth token was refreshed */
  AUTH_OAUTH_REFRESH: 'auth:oauth_refresh',
  /** User selected an OAuth flow — capture { flow_type } to know which flows to prioritise */
  AUTH_OAUTH_FLOW_SELECT: 'auth:oauth_flow_select',
  /** Auth scheme type used — capture { scheme_type } to know what auth your users' APIs require */
  AUTH_SCHEME_TYPE_USE: 'auth:scheme_type_use',
  /** User manually cleared an OAuth token — high frequency signals auth friction */
  AUTH_TOKEN_CLEAR: 'auth:token_clear',
  /** User added a custom OAuth scope beyond the spec-defined ones */
  AUTH_SCOPE_ADD: 'auth:scope_add',

  // --------------------------------------------------
  // Command Palette
  // --------------------------------------------------

  /** User opened the command palette */
  COMMAND_PALETTE_OPEN: 'command_palette:open',
  /** User selected an action command — capture { command_id } to see which are most used */
  COMMAND_PALETTE_COMMAND_SELECT: 'command_palette:command_select',

  // --------------------------------------------------
  // Scripts (pre-request / post-response)
  // --------------------------------------------------

  /** User saved a pre-request script — capture { is_empty } to track adoption vs removal */
  SCRIPT_PRE_REQUEST_SAVE: 'script:pre_request_save',
  /** User saved a post-response script — capture { is_empty } to track adoption vs removal */
  SCRIPT_POST_RESPONSE_SAVE: 'script:post_response_save',
  /** Pre-request script ran — capture { success } to surface script error rates */
  SCRIPT_PRE_REQUEST_EXECUTE: 'script:pre_request_execute',
  /** Post-response script ran — capture { test_count, pass_count, fail_count } to measure test adoption */
  SCRIPT_POST_RESPONSE_EXECUTE: 'script:post_response_execute',
  /** User inserted an example script from the examples panel */
  SCRIPT_EXAMPLE_INSERT: 'script:example_insert',

  // --------------------------------------------------
  // Code snippets
  // --------------------------------------------------

  /** User copied a code snippet — capture { client, language } to see which integrations matter most */
  SNIPPET_COPY: 'snippet:copy',
  /** User changed the snippet language/client — capture { client, language } to see browsing patterns */
  SNIPPET_LANGUAGE_CHANGE: 'snippet:language_change',

  // --------------------------------------------------
  // Document
  // --------------------------------------------------

  /** User created a new document */
  DOCUMENT_CREATE: 'document:create',
  /** User deleted a document */
  DOCUMENT_DELETE: 'document:delete',
  /** User downloaded a document */
  DOCUMENT_DOWNLOAD: 'document:download',
  /** User imported a document from a URL */
  DOCUMENT_IMPORT_URL: 'document:import_url',
  /** User imported a document from a file */
  DOCUMENT_IMPORT_FILE: 'document:import_file',
  /** User imported a document from a Postman collection */
  DOCUMENT_IMPORT_POSTMAN: 'document:import_postman',
  /** User imported a document from a cURL command */
  DOCUMENT_IMPORT_CURL: 'document:import_curl',

  // --------------------------------------------------
  // Environment
  // --------------------------------------------------

  /** User created a new environment */
  ENVIRONMENT_CREATE: 'environment:create',
  /** User created or updated an environment */
  ENVIRONMENT_SAVE: 'environment:save',
  /** User switched to a different environment */
  ENVIRONMENT_SELECT: 'environment:select',

  // --------------------------------------------------
  // Operation
  // --------------------------------------------------

  /** User sent a request */
  REQUEST_SEND: 'operation:request_send',
  /** Request completed with a 2xx response */
  REQUEST_SUCCESS: 'operation:request_success',
  /** Request completed with an error or non-2xx response */
  REQUEST_FAIL: 'operation:request_fail',
  /** User changed the HTTP method on the address bar — capture { method } to see method distribution */
  OPERATION_METHOD_CHANGE: 'operation:method_change',
  /** User copied the resolved request URL from the address bar */
  OPERATION_URL_COPY: 'operation:url_copy',
  /** User opened the request history dropdown */
  OPERATION_HISTORY_OPEN: 'operation:history_open',
  /** User replayed a request from history — capture { status_code } to see if they retry failures */
  OPERATION_HISTORY_SELECT: 'operation:history_select',
  /** User pasted a full URL and the bar auto-extracted the server and path */
  OPERATION_SERVER_EXTRACT: 'operation:server_extract',
  /** User created a new operation */
  OPERATION_CREATE: 'operation:create',
  /** User deleted an operation */
  OPERATION_DELETE: 'operation:delete',
  /** User changed the request body content-type filter — capture { content_type } to see format distribution */
  OPERATION_REQUEST_BODY_FILTER: 'operation:request_body_filter',
  /** User set a server override on a specific operation — indicates need for per-operation server control */
  OPERATION_SERVER_OVERRIDE: 'operation:server_override',
  /** User set an auth override on a specific operation — indicates need for per-operation auth control */
  OPERATION_AUTH_OVERRIDE: 'operation:auth_override',

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  /** User opened the search */
  SEARCH_OPEN: 'search:open',
  /** User selected a result from search */
  SEARCH_RESULT_SELECT: 'search:result_select',

  // --------------------------------------------------
  // Server
  // --------------------------------------------------

  /** User added a server */
  SERVER_ADD: 'server:add',
  /** User switched to a different server — capture { is_custom } to distinguish spec vs user-added */
  SERVER_SELECT: 'server:select',
  /** User edited a server variable value — indicates parameterised server URLs in use */
  SERVER_VARIABLE_UPDATE: 'server:variable_update',

  // --------------------------------------------------
  // Settings
  // --------------------------------------------------

  /** User changed the proxy setting — capture { proxy_type: 'scalar' | 'none' } to measure CORS proxy reliance */
  SETTINGS_PROXY_CHANGE: 'settings:proxy_change',
  /** User selected a theme — capture { theme_slug } to know which themes to keep investing in */
  SETTINGS_THEME_CHANGE: 'settings:theme_change',
  /** User changed appearance mode — capture { color_mode: 'light' | 'dark' | 'system' } */
  SETTINGS_COLOR_MODE_CHANGE: 'settings:color_mode_change',
  /** User toggled telemetry — capture { enabled } to understand opt-out rates */
  SETTINGS_TELEMETRY_CHANGE: 'settings:telemetry_change',
  /** User toggled watch mode on a document — capture { enabled } to identify active-dev users */
  SETTINGS_WATCH_MODE_TOGGLE: 'settings:watch_mode_toggle',

  // --------------------------------------------------
  // OpenAPI Editor
  // --------------------------------------------------

  /** User opened the OpenAPI editor for an operation */
  EDITOR_OPEN: 'editor:open',
  /** User switched editor language — capture { language: 'json' | 'yaml' } to know which to optimise */
  EDITOR_LANGUAGE_CHANGE: 'editor:language_change',
  /** User manually saved the document */
  EDITOR_SAVE: 'editor:save',
  /** User toggled auto-save — capture { enabled } to understand trust/workflow patterns */
  EDITOR_AUTO_SAVE_TOGGLE: 'editor:auto_save_toggle',
  /** User formatted the document */
  EDITOR_FORMAT: 'editor:format',
  /** User toggled maximized editor view — indicates complex specs needing more screen space */
  EDITOR_MAXIMIZE_TOGGLE: 'editor:maximize_toggle',
  /** Editor has validation diagnostics on save — capture { error_count, warning_count } */
  EDITOR_DIAGNOSTICS: 'editor:diagnostics',

  // --------------------------------------------------
  // Cookies
  // --------------------------------------------------

  /** User created a new cookie — capture { scope: 'document' | 'workspace' } */
  COOKIE_CREATE: 'cookie:create',
  /** User deleted a cookie — capture { scope: 'document' | 'workspace' } */
  COOKIE_DELETE: 'cookie:delete',

  // --------------------------------------------------
  // Tag
  // --------------------------------------------------

  /** User created a new tag */
  TAG_CREATE: 'tag:create',

  // --------------------------------------------------
  // Workspace
  // --------------------------------------------------

  /** User created a new workspace */
  WORKSPACE_CREATE: 'workspace:create',
  /** User switched to a different workspace */
  WORKSPACE_SWITCH: 'workspace:switch',

  // --------------------------------------------------
  // MISC
  // --------------------------------------------------

  /** User opened the API client modal */
  MODAL_OPEN: 'client:modal_open',
} as const
