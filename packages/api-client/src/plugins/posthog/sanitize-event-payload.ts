import type { ApiReferenceEvents } from '@scalar/workspace-store/events'

// Helpers — defensive extraction from unknown payloads so each extractor
// stays concise without repeating the same type-narrowing boilerplate.

const extractString = (obj: unknown, key: string): string | undefined => {
  if (!obj || typeof obj !== 'object') {
    return undefined
  }
  const value = (obj as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

const extractNestedString = (obj: unknown, outerKey: string, innerKey: string): string | undefined => {
  if (!obj || typeof obj !== 'object') {
    return undefined
  }
  const nested = (obj as Record<string, unknown>)[outerKey]
  return extractString(nested, innerKey)
}

// Extractor shorthands — used repeatedly across the allowlist so that
// each entry is a one-liner instead of a duplicated closure.

const metaType = (payload: unknown): Record<string, unknown> => {
  const value = extractNestedString(payload, 'meta', 'type')
  return value !== undefined ? { 'meta.type': value } : {}
}

const payloadType = (payload: unknown): Record<string, unknown> => {
  const value = extractNestedString(payload, 'payload', 'type')
  return value !== undefined ? { 'payload.type': value } : {}
}

const collectionType = (payload: unknown): Record<string, unknown> => {
  const value = extractString(payload, 'collectionType')
  return value !== undefined ? { collectionType: value } : {}
}

const payloadContentType = (payload: unknown): Record<string, unknown> => {
  const value = extractNestedString(payload, 'payload', 'contentType')
  return value !== undefined ? { 'payload.contentType': value } : {}
}

const formatProp = (payload: unknown): Record<string, unknown> => {
  const value = extractString(payload, 'format')
  return value !== undefined ? { format: value } : {}
}

const empty = (): Record<string, unknown> => ({})

/**
 * Allowlist of events that should be forwarded to PostHog.
 *
 * Each key is an event name; its value is an extractor that pulls only the
 * safe, non-PII properties we want to track. Events not in this map are
 * silently dropped — this keeps the analytics surface explicit and auditable.
 */
type PayloadExtractor<K extends keyof ApiReferenceEvents = keyof ApiReferenceEvents> = (
  payload: ApiReferenceEvents[K],
) => Record<string, unknown> | ApiReferenceEvents[K]

/** Maps every event to either a typed extractor or `undefined` (opt-out) */
type TrackedEventsMap = {
  [K in keyof ApiReferenceEvents]: PayloadExtractor<K> | undefined
}

export const TRACKED_EVENTS: TrackedEventsMap = {
  // Auth events — track the scheme type so we know which auth methods are popular
  'auth:update:selected-security-schemes': metaType,
  'auth:update:active-index': metaType,
  'auth:update:security-scheme': payloadType,
  'auth:clear:selected-security-schemes': metaType,
  'auth:update:selected-scopes': metaType,
  'auth:delete:security-scheme': empty,
  'auth:clear:security-scheme-secrets': empty,

  // Cookie events — track whether it belongs to a document or workspace
  'cookie:upsert:cookie': collectionType,
  'cookie:delete:cookie': collectionType,

  // Environment events — same document-vs-workspace distinction
  'environment:upsert:environment': collectionType,
  'environment:delete:environment': collectionType,
  'environment:upsert:environment-variable': collectionType,
  'environment:delete:environment-variable': collectionType,

  // Document lifecycle
  'document:create:empty-document': empty,
  'document:delete:document': empty,
  'document:update:info': empty,
  'document:update:icon': empty,
  'document:update:watch-mode': empty,

  // Operation events — contentType helps us understand payload format usage
  'operation:send:request:hotkey': empty,
  'operation:cancel:request': empty,
  'operation:create:operation': empty,
  'operation:delete:operation': empty,
  'operation:create:draft-example': empty,
  'operation:delete:example': empty,
  'operation:update:requestBody:contentType': payloadContentType,
  'operation:update:pathMethod': empty,
  'operation:rename:example': empty,
  'operation:reload:history': empty,

  // UI events — track which surfaces users interact with
  'ui:open:client-modal': empty,
  'ui:open:command-palette': empty,
  'ui:open:settings': empty,
  'ui:download:document': formatProp,
  'ui:toggle:sidebar': empty,
  'copy-url:address-bar': empty,
  'tabs:add:tab': empty,
  'tabs:copy:url': empty,

  // Server events
  'server:add:server': empty,
  'server:delete:server': empty,

  // Tag events
  'tag:create:tag': empty,
  'tag:delete:tag': empty,

  // Request lifecycle hooks — lets us measure request volume without capturing bodies
  'hooks:on:request:sent': empty,
  'hooks:on:request:complete': empty,
  'hooks:on:rebase:document:complete': empty,

  // Workspace preference events
  'workspace:update:color-mode': empty,
  'workspace:update:theme': empty,
  'workspace:update:selected-client': empty,
  'workspace:update:active-proxy': (payload) => ({ enabled: !!payload }),
  'workspace:update:active-environment': empty,

  // Meta events
  'update:dark-mode': empty,
  'update:active-document': empty,
  'update:selected-client': empty,

  // Account funnel events
  'log:login-click': empty,
  'log:register-click': empty,

  // ---------------------------------------------------------------------------
  // Do not track — explicitly opted out so new events cause a type error
  // until they are consciously placed above with a payload
  // ---------------------------------------------------------------------------
  'auth:update:security-scheme-secrets': undefined,
  'analytics:on:show-more': undefined,
  'analytics:on:loaded': undefined,
  'document:update:extension': undefined,
  'log:user-login': undefined,
  'log:user-logout': undefined,
  'operation:update:meta': undefined,
  'operation:update:extension': undefined,
  'operation:upsert:parameter': undefined,
  'operation:update:extra-parameters': undefined,
  'operation:delete:parameter': undefined,
  'operation:delete-all:parameters': undefined,
  'operation:update:requestBody:value': undefined,
  'operation:update:requestBody:formValue': undefined,
  'server:initialize:servers': undefined,
  'server:update:server': undefined,
  'server:update:variables': undefined,
  'server:update:selected': undefined,
  'server:clear:servers': undefined,
  'tabs:update:tabs': undefined,
  'tabs:close:tab': undefined,
  'tabs:close:other-tabs': undefined,
  'tabs:navigate:previous': undefined,
  'tabs:navigate:next': undefined,
  'tabs:focus:tab': undefined,
  'tabs:focus:tab-last': undefined,
  'ui:focus:address-bar': undefined,
  'ui:focus:send-button': undefined,
  'ui:focus:search': undefined,
  'ui:open:create-workspace': undefined,
  'ui:close:client-modal': undefined,
  'ui:navigate': undefined,
  'toggle:nav-item': undefined,
  'select:nav-item': undefined,
  'intersecting:nav-item': undefined,
  'scroll-to:nav-item': undefined,
  'scroll-to:model-by-name': undefined,
  'copy-url:nav-item': undefined,
  'tag:edit:tag': undefined,
  'workspace:update:name': undefined,
}

/**
 * Returns sanitized properties for a tracked event, or `null` if the event
 * should not be captured at all.
 *
 * This is the only function that the PostHog plugin needs to call — it
 * encapsulates both the "should we track this?" decision and the "what
 * properties are safe to send?" extraction in one step.
 */
export const sanitizeEventPayload = <K extends keyof ApiReferenceEvents>(
  event: K,
  payload: ApiReferenceEvents[K],
): Record<string, unknown> | ApiReferenceEvents[K] | null => {
  const extractor = TRACKED_EVENTS[event]
  if (!extractor) {
    return null
  }
  return extractor(payload)
}
