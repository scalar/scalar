import { isObject } from '@scalar/helpers/object/is-object'
import { slugify } from '@scalar/helpers/string/slugify'
import type { UnknownObject } from '@scalar/types/utils'

/** The AsyncAPI version produced by this upgrade step. */
const ASYNCAPI_VERSION = '3.0.0'

/**
 * Upgrade an AsyncAPI 2.x document to 3.0.0.
 *
 * Each transformation is the smallest change needed to bring the 2.x shape in line with 3.0.
 * See `upgrade-from-two-to-three.test.ts` for the source of truth — every rule is one test.
 */
export function upgradeFromTwoToThree(originalDocument: UnknownObject): UnknownObject {
  const document = originalDocument

  if (!isObject(document) || typeof document.asyncapi !== 'string' || !document.asyncapi.startsWith('2.')) {
    return document
  }

  document.asyncapi = ASYNCAPI_VERSION

  // OAuth flows must be rewritten before security requirements consult them.
  upgradeComponentOAuthScopes(document)
  upgradeServers(document)
  upgradeChannelsAndOperations(document)

  return document
}

// ---------------------------------------------------------------------------
// Servers
// ---------------------------------------------------------------------------

/**
 * Servers: `url` becomes `host` (+ optional `pathname` when the URL contains a path).
 * `security` entries become either `$ref` (non-OAuth) or inline scheme + scopes array (OAuth).
 */
function upgradeServers(document: UnknownObject): void {
  if (!isObject(document.servers)) {
    return
  }

  const securitySchemes = getSecuritySchemes(document)

  for (const server of Object.values(document.servers)) {
    if (!isObject(server)) {
      continue
    }

    if (typeof server.url === 'string') {
      const { host, pathname } = splitUrl(server.url)
      server.host = host
      if (pathname) {
        server.pathname = pathname
      }
      delete server.url
    }

    if (Array.isArray(server.security)) {
      server.security = upgradeSecurity(server.security, securitySchemes)
    }
  }
}

/**
 * Splits a 2.x server URL into a 3.0 `host` (hostname plus optional port) and `pathname`.
 *
 * The scheme is dropped because AsyncAPI 3.0 carries the protocol exclusively in the `protocol`
 * field — keeping it on `host` would duplicate that information and violate the spec.
 */
function splitUrl(url: string): { host: string; pathname: string } {
  const schemeMatch = url.match(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/(.*)$/)
  const rest = schemeMatch ? schemeMatch[1]! : url

  const slashIndex = rest.indexOf('/')
  if (slashIndex === -1) {
    return { host: rest, pathname: '' }
  }
  return { host: rest.slice(0, slashIndex), pathname: rest.slice(slashIndex) }
}

/** Maps every 2.x security requirement to its 3.0 form (`$ref` or inline OAuth + `scopes`). */
function upgradeSecurity(security: unknown[], securitySchemes: Record<string, UnknownObject>): UnknownObject[] {
  return security
    .map((requirement) => upgradeSecurityRequirement(requirement, securitySchemes))
    .filter((entry): entry is UnknownObject => entry !== undefined)
}

/**
 * Rewrites one 2.x security requirement object into its 3.0 form. 2.x security requirement objects
 * have exactly one key (the scheme name) and an array of scope names — we read that single entry.
 */
function upgradeSecurityRequirement(
  requirement: unknown,
  securitySchemes: Record<string, UnknownObject>,
): UnknownObject | undefined {
  if (!isObject(requirement)) {
    return undefined
  }

  const [entry] = Object.entries(requirement)
  if (!entry) {
    return undefined
  }
  const [name, scopes] = entry
  const scheme = securitySchemes[name]

  if (isObject(scheme) && scheme.type === 'oauth2' && Array.isArray(scopes)) {
    return { ...scheme, scopes }
  }

  return { $ref: `#/components/securitySchemes/${name}` }
}

function getSecuritySchemes(document: UnknownObject): Record<string, UnknownObject> {
  if (!isObject(document.components) || !isObject(document.components.securitySchemes)) {
    return {}
  }
  const schemes: Record<string, UnknownObject> = {}
  for (const [name, value] of Object.entries(document.components.securitySchemes)) {
    if (isObject(value)) {
      schemes[name] = value
    }
  }
  return schemes
}

// ---------------------------------------------------------------------------
// OAuth scopes → availableScopes (in components.securitySchemes)
// ---------------------------------------------------------------------------

/** Renames `scopes` → `availableScopes` on every flow of every OAuth scheme in components. */
function upgradeComponentOAuthScopes(document: UnknownObject): void {
  if (!isObject(document.components) || !isObject(document.components.securitySchemes)) {
    return
  }

  for (const scheme of Object.values(document.components.securitySchemes)) {
    if (!isObject(scheme) || scheme.type !== 'oauth2' || !isObject(scheme.flows)) {
      continue
    }

    for (const flow of Object.values(scheme.flows)) {
      if (isObject(flow) && 'scopes' in flow) {
        flow.availableScopes = flow.scopes
        delete flow.scopes
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Channels & operations
// ---------------------------------------------------------------------------

/**
 * Channels become identifier-keyed with an `address` field. Each `publish`/`subscribe` operation is
 * lifted to the top-level `operations` map with `action: 'receive' | 'send'`, and its message(s)
 * move into `channel.messages` (keyed by message id derived from the `$ref` or `name`).
 *
 * The 2.x `publish` semantics — the application receives the message — maps to 3.0 `action: 'receive'`.
 * The 2.x `subscribe` semantics — the application sends the message — maps to 3.0 `action: 'send'`.
 */
function upgradeChannelsAndOperations(document: UnknownObject): void {
  if (!isObject(document.channels)) {
    return
  }

  const securitySchemes = getSecuritySchemes(document)
  const channels: Record<string, UnknownObject> = {}
  const operations: Record<string, UnknownObject> = {}
  const usedChannelIds = new Set<string>()
  const usedOperationKeys = new Set<string>()

  for (const [path, channel] of Object.entries(document.channels)) {
    if (!isObject(channel)) {
      continue
    }

    const channelId = uniqueKey(slugifyChannelPath(path), usedChannelIds)
    const newChannel: UnknownObject = { address: path }
    const messages: Record<string, UnknownObject> = {}

    for (const [field, value] of Object.entries(channel)) {
      if (field === 'publish' || field === 'subscribe' || field === 'parameters') {
        continue
      }
      if (field === 'servers' && Array.isArray(value)) {
        newChannel.servers = value.map((name) => ({ $ref: `#/servers/${name}` }))
        continue
      }
      newChannel[field] = value
    }
    if (isObject(channel.parameters)) {
      newChannel.parameters = channel.parameters
    }

    const publishMessages = collectMessages(channel.publish, messages)
    const subscribeMessages = collectMessages(channel.subscribe, messages)

    newChannel.messages = messages
    channels[channelId] = newChannel

    if (isObject(channel.publish)) {
      const opKey = uniqueKey(operationKey(channel.publish, 'receive', channelId), usedOperationKeys)
      operations[opKey] = buildOperation(channel.publish, 'receive', channelId, publishMessages, securitySchemes)
    }
    if (isObject(channel.subscribe)) {
      const opKey = uniqueKey(operationKey(channel.subscribe, 'send', channelId), usedOperationKeys)
      operations[opKey] = buildOperation(channel.subscribe, 'send', channelId, subscribeMessages, securitySchemes)
    }
  }

  document.channels = channels
  document.operations = operations
}

/**
 * Extracts each message reference from a 2.x operation's `message` field (single or `oneOf`) into
 * the channel-level `messages` map; returns the message ids in order for use in `operation.messages`.
 */
function collectMessages(operation: unknown, channelMessages: Record<string, UnknownObject>): string[] {
  if (!isObject(operation) || !isObject(operation.message)) {
    return []
  }

  const message = operation.message
  const items = Array.isArray(message.oneOf) ? message.oneOf : [message]
  const ids: string[] = []

  for (const item of items) {
    if (!isObject(item)) {
      continue
    }
    const id = messageId(item, channelMessages)
    channelMessages[id] = item
    ids.push(id)
  }

  return ids
}

/**
 * Derives a channel-message map key from a message: last `$ref` segment, `name`, or a generated
 * `message-N`. The generated fallback is checked against the keys already present in the shared
 * channel-message map so that anonymous inline messages from `publish` and `subscribe` do not
 * collide on `message-0` and overwrite each other.
 */
function messageId(message: UnknownObject, existingMessages: Record<string, UnknownObject>): string {
  if (typeof message.$ref === 'string') {
    const last = message.$ref.split('/').pop()
    if (last) {
      return last
    }
  }
  if (typeof message.name === 'string' && message.name) {
    return message.name
  }
  let index = 0
  while (`message-${index}` in existingMessages) {
    index += 1
  }
  return `message-${index}`
}

/** Reuses 2.x `operationId` when present; otherwise generates `${action}-${channelId}`. */
function operationKey(operation: UnknownObject, action: 'send' | 'receive', channelId: string): string {
  if (typeof operation.operationId === 'string' && operation.operationId) {
    return operation.operationId
  }
  return `${action}-${channelId}`
}

/** Assembles the 3.0 Operation Object from the 2.x publish/subscribe shape. */
function buildOperation(
  operation: UnknownObject,
  action: 'send' | 'receive',
  channelId: string,
  messageIds: string[],
  securitySchemes: Record<string, UnknownObject>,
): UnknownObject {
  const result: UnknownObject = { action, channel: { $ref: `#/channels/${channelId}` } }

  for (const [field, value] of Object.entries(operation)) {
    if (field === 'message' || field === 'operationId') {
      continue
    }
    if (field === 'security' && Array.isArray(value)) {
      result.security = upgradeSecurity(value, securitySchemes)
      continue
    }
    result[field] = value
  }

  result.messages = messageIds.map((id) => ({ $ref: `#/channels/${channelId}/messages/${id}` }))
  return result
}

/**
 * Slugify a channel path (e.g. `user/{id}/signedup` → `user-id-signedup`).
 *
 * `@scalar/helpers/string/slugify` drops non-word characters outright, but channel paths use `/`,
 * `.`, `{`, and `}` as logical separators we want preserved as hyphens — so we pre-replace any run
 * of non-alphanumerics with a space and let the shared slugify collapse those into hyphens.
 */
function slugifyChannelPath(value: string): string {
  return slugify(value.replace(/[^a-zA-Z0-9]+/g, ' '))
}

/** Returns the base key if unused, otherwise appends `-2`, `-3`, … until unique. Mutates `usedKeys`. */
function uniqueKey(base: string, usedKeys: Set<string>): string {
  if (!usedKeys.has(base)) {
    usedKeys.add(base)
    return base
  }
  let suffix = 2
  while (usedKeys.has(`${base}-${suffix}`)) {
    suffix += 1
  }
  const key = `${base}-${suffix}`
  usedKeys.add(key)
  return key
}
