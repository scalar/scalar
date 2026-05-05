/**
 * Centralized dictionary of PostHog analytics event names.
 *
 * Naming convention follows PostHog best practices:
 * - Format: `category:object_action`
 * - snake_case throughout
 * - Present-tense verbs (click, create, delete, send, open, add, select, download)
 *
 * @see https://posthog.com/docs/product-analytics/best-practices
 *
 * The category is the entity or domain the event belongs to, not the product
 * it originates from. This makes the same events reusable across products.
 */
export const ANALYTICS_EVENTS = {
  // --------------------------------------------------
  // Operation
  // --------------------------------------------------

  /** User sent a request through the API client */
  REQUEST_SEND: 'operation:request_send',
  /** User created a new operation */
  OPERATION_CREATE: 'operation:create',
  /** User deleted an operation */
  OPERATION_DELETE: 'operation:delete',

  /** User created a new document */
  DOCUMENT_CREATE: 'document:create',
  /** User deleted a document */
  DOCUMENT_DELETE: 'document:delete',
  /** User downloaded a document */
  DOCUMENT_DOWNLOAD: 'document:download',

  /** User created a new tag */
  TAG_CREATE: 'tag:create',

  /** User added a server */
  SERVER_ADD: 'server:add',
  /** User opened the API client modal */
  MODAL_OPEN: 'modal_open',
  /** User selected an auth security scheme */
  AUTH_SCHEME_SELECT: 'auth:scheme_select',
  /** User created or updated an environment */
  ENVIRONMENT_SAVE: 'environment:save',

  // --------------------------------------------------
  // Account
  // --------------------------------------------------

  /** User clicked a login button */
  LOGIN_CLICK: 'account:login_click',
  /** User clicked the register button */
  REGISTER_CLICK: 'account:register_click',
} as const
