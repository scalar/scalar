import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'

/**
 * Builds an extractor that pulls a string from `payload` at `path` and emits
 * it under `{ [key]: value }`. Returns `{}` when the leaf is missing or is
 * not a string.
 *
 * `key` defaults to the dotted form of `path` (e.g. `['meta', 'type']` becomes
 * `'meta.type'`), matching the existing PostHog property names.
 *
 * Built on `getValueAtPath`, so null/undefined traversal and missing segments
 * are handled centrally.
 */
const stringAtPath = (path: string[], key: string = path.join('.')) => {
  return (payload: unknown): Record<string, unknown> => {
    const value = getValueAtPath(payload, path)
    return typeof value === 'string' ? { [key]: value } : {}
  }
}

/** Extractor for events whose only useful property is the fact they fired. */
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
  'auth:update:selected-security-schemes': stringAtPath(['meta', 'type']),
  'auth:update:active-index': stringAtPath(['meta', 'type']),
  'auth:update:security-scheme': stringAtPath(['payload', 'type']),
  'auth:clear:selected-security-schemes': stringAtPath(['meta', 'type']),
  'auth:update:selected-scopes': stringAtPath(['meta', 'type']),
  'auth:delete:security-scheme': empty,
  'auth:clear:security-scheme-secrets': empty,
  'auth:upsert:scopes': empty,
  'auth:delete:scopes': empty,

  // Cookie events — track whether it belongs to a document or workspace
  'cookie:upsert:cookie': stringAtPath(['collectionType']),
  'cookie:delete:cookie': stringAtPath(['collectionType']),

  // Environment events — same document-vs-workspace distinction
  'environment:upsert:environment': stringAtPath(['collectionType']),
  'environment:delete:environment': stringAtPath(['collectionType']),
  'environment:upsert:environment-variable': stringAtPath(['collectionType']),
  'environment:delete:environment-variable': stringAtPath(['collectionType']),

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
  'operation:update:requestBody:contentType': stringAtPath(['payload', 'contentType']),
  'operation:update:pathMethod': empty,
  'operation:rename:example': empty,
  'operation:reload:history': empty,

  // UI events — track which surfaces users interact with
  'ui:open:client-modal': empty,
  'ui:open:command-palette': empty,
  'ui:open:settings': empty,
  'ui:download:document': stringAtPath(['format']),
  'ui:toggle:sidebar': empty,
  'ui:save:local-document': empty,
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
  'log:user-login': empty,
  'log:user-logout': empty,

  // ---------------------------------------------------------------------------
  // Do not track — explicitly opted out so new events cause a type error
  // until they are consciously placed above with a payload
  // ---------------------------------------------------------------------------
  'auth:update:security-scheme-secrets': undefined,
  'analytics:on:show-more': undefined,
  'analytics:on:loaded': undefined,
  'document:update:extension': undefined,
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
