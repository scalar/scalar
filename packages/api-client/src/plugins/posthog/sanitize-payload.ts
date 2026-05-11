// Helpers — defensive extraction from unknown payloads so each extractor
// stays concise without repeating the same type-narrowing boilerplate.

const extractString = (obj: unknown, key: string): string | undefined => {
  if (!obj || typeof obj !== 'object') return undefined
  const value = (obj as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

const extractNestedString = (obj: unknown, outerKey: string, innerKey: string): string | undefined => {
  if (!obj || typeof obj !== 'object') return undefined
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
export const TRACKED_EVENTS: Map<string, (payload: unknown) => Record<string, unknown>> = new Map([
  // Auth events — track the scheme type so we know which auth methods are popular
  ['auth:update:selected-security-schemes', metaType],
  ['auth:update:active-index', metaType],
  ['auth:update:security-scheme', payloadType],
  ['auth:clear:selected-security-schemes', metaType],
  ['auth:update:selected-scopes', metaType],
  ['auth:delete:security-scheme', empty],
  ['auth:clear:security-scheme-secrets', empty],

  // Cookie events — track whether it belongs to a document or workspace
  ['cookie:upsert:cookie', collectionType],
  ['cookie:delete:cookie', collectionType],

  // Environment events — same document-vs-workspace distinction
  ['environment:upsert:environment', collectionType],
  ['environment:delete:environment', collectionType],
  ['environment:upsert:environment-variable', collectionType],
  ['environment:delete:environment-variable', collectionType],

  // Document lifecycle — no extra properties needed
  ['document:create:empty-document', empty],
  ['document:delete:document', empty],

  // Operation events — contentType helps us understand payload format usage
  ['operation:send:request:hotkey', empty],
  ['operation:cancel:request', empty],
  ['operation:create:operation', empty],
  ['operation:delete:operation', empty],
  ['operation:create:draft-example', empty],
  ['operation:delete:example', empty],
  ['operation:update:requestBody:contentType', payloadContentType],

  // UI events — track which surfaces users interact with
  ['ui:open:client-modal', empty],
  ['ui:open:command-palette', empty],
  ['ui:open:settings', empty],
  ['ui:download:document', formatProp],

  // Server events
  ['server:add:server', empty],
  ['server:delete:server', empty],

  // Tag events
  ['tag:create:tag', empty],
  ['tag:delete:tag', empty],

  // Request lifecycle hooks — lets us measure request volume without capturing bodies
  ['hooks:on:request:sent', empty],
  ['hooks:on:request:complete', empty],

  // Workspace preference events
  ['workspace:update:color-mode', empty],
  ['workspace:update:theme', empty],
  ['workspace:update:selected-client', empty],

  // Account funnel events
  ['log:login-click', empty],
  ['log:register-click', empty],
])

/**
 * Returns sanitized properties for a tracked event, or `null` if the event
 * should not be captured at all.
 *
 * This is the only function that the PostHog plugin needs to call — it
 * encapsulates both the "should we track this?" decision and the "what
 * properties are safe to send?" extraction in one step.
 */
export const sanitizeEventPayload = (event: string, payload: unknown): Record<string, unknown> | null => {
  const extractor = TRACKED_EVENTS.get(event)
  if (!extractor) return null
  return extractor(payload)
}
