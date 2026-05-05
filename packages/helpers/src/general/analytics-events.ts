/**
 * Centralized dictionary of PostHog analytics event names.
 *
 * Naming convention follows PostHog best practices:
 * - Format: `category:object_action`
 * - snake_case throughout
 * - Present-tense verbs (click, create, delete, send, open, add, select, download)
 *
 * The string value is already scoped by its category prefix (`api_client:`,
 * `auth:`, etc.), so keys are kept flat and descriptive without nesting.
 *
 * @see https://posthog.com/docs/product-analytics/best-practices
 */
export const ANALYTICS_EVENTS = {
  // --------------------------------------------------
  // API Client
  // --------------------------------------------------

  /** User sent a request through the API client */
  REQUEST_SEND: 'api_client:request_send',
  /** User opened the API client modal */
  MODAL_OPEN: 'api_client:modal_open',
  /** User created a new operation */
  OPERATION_CREATE: 'api_client:operation_create',
  /** User deleted an operation */
  OPERATION_DELETE: 'api_client:operation_delete',
  /** User created a new document */
  DOCUMENT_CREATE: 'api_client:document_create',
  /** User deleted a document */
  DOCUMENT_DELETE: 'api_client:document_delete',
  /** User downloaded a document */
  DOCUMENT_DOWNLOAD: 'api_client:document_download',
  /** User created a new tag */
  TAG_CREATE: 'api_client:tag_create',
  /** User added a server */
  SERVER_ADD: 'api_client:server_add',
  /** User selected an auth security scheme */
  AUTH_SCHEME_SELECT: 'api_client:auth_scheme_select',
  /** User created or updated an environment */
  ENVIRONMENT_SAVE: 'api_client:environment_save',

  // --------------------------------------------------
  // Account
  // --------------------------------------------------

  /** User clicked a login button */
  LOGIN_CLICK: 'account:login_button_click',
  /** User clicked the register button */
  REGISTER_CLICK: 'account:register_button_click',
} as const
