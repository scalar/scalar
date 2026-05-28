import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/** The AsyncAPI version produced by this upgrade step. */
const ASYNCAPI_VERSION = '2.6.0'

/** The synthetic channel name used when consolidating a 1.x `stream` or `events` object. */
const ROOT_CHANNEL = '/'

/**
 * Upgrade an AsyncAPI 1.x document to 2.6.0.
 *
 * Each transformation is the smallest change needed to bring the 1.x shape in line with 2.x.
 * See `upgrade-from-one-to-two.test.ts` for the source of truth — every rule is one test.
 */
export function upgradeFromOneToTwo(originalDocument: UnknownObject): UnknownObject {
  const document = originalDocument

  if (!isObject(document) || typeof document.asyncapi !== 'string' || !document.asyncapi.startsWith('1.')) {
    return document
  }

  document.asyncapi = ASYNCAPI_VERSION
  upgradeServers(document)
  upgradeChannels(document)
  upgradeStream(document)
  upgradeEvents(document)

  return document
}

/** Servers: array of { url, scheme, schemeVersion, ... } → map { key: { url, protocol, protocolVersion, ... } }. */
function upgradeServers(document: UnknownObject): void {
  if (!Array.isArray(document.servers)) {
    return
  }

  const result: Record<string, UnknownObject> = {}
  const usedKeys = new Set<string>()

  document.servers.forEach((server, index) => {
    if (!isObject(server)) {
      return
    }

    const upgraded: UnknownObject = {}
    for (const [field, value] of Object.entries(server)) {
      if (field === 'scheme') {
        upgraded.protocol = value
      } else if (field === 'schemeVersion') {
        upgraded.protocolVersion = value
      } else {
        upgraded[field] = value
      }
    }

    const key = uniqueServerKey(typeof server.description === 'string' ? server.description : '', index, usedKeys)
    usedKeys.add(key)
    result[key] = upgraded
  })

  document.servers = result
}

/** Slugify a description; fall back to `server-{index}`; dedupe collisions with `-2`, `-3`, … */
function uniqueServerKey(description: string, index: number, usedKeys: Set<string>): string {
  const base = slugify(description) || `server-${index}`
  if (!usedKeys.has(base)) {
    return base
  }
  let suffix = 2
  while (usedKeys.has(`${base}-${suffix}`)) {
    suffix += 1
  }
  return `${base}-${suffix}`
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** topics → channels, with operation/parameter shape changes and `baseTopic` prepending. */
function upgradeChannels(document: UnknownObject): void {
  if (!isObject(document.topics)) {
    if (typeof document.baseTopic === 'string') {
      delete document.baseTopic
    }
    return
  }

  const baseTopic = typeof document.baseTopic === 'string' ? document.baseTopic : ''
  const channels: Record<string, UnknownObject> = {}

  for (const [topic, item] of Object.entries(document.topics)) {
    if (!isObject(item)) {
      continue
    }

    const channelName = baseTopic ? `${baseTopic}.${topic}` : topic
    const channel: UnknownObject = {}

    for (const [field, value] of Object.entries(item)) {
      if (field === 'parameters') {
        const parameters = upgradeChannelParameters(value)
        if (parameters) {
          channel.parameters = parameters
        }
      } else if (field === 'publish' || field === 'subscribe') {
        channel[field] = { message: value }
      } else {
        channel[field] = value
      }
    }

    channels[channelName] = channel
  }

  document.channels = channels
  delete document.topics
  delete document.baseTopic
}

/** `parameters: [{ name, ... }]` → `parameters: { name: { ... } }`. Also handles `$ref` items. */
function upgradeChannelParameters(parameters: unknown): Record<string, UnknownObject> | undefined {
  if (!Array.isArray(parameters)) {
    return undefined
  }

  const result: Record<string, UnknownObject> = {}

  for (const parameter of parameters) {
    if (!isObject(parameter)) {
      continue
    }

    if (typeof parameter.$ref === 'string') {
      const key = parameter.$ref.split('/').pop() ?? ''
      if (key) {
        result[key] = { $ref: parameter.$ref }
      }
      continue
    }

    if (typeof parameter.name !== 'string') {
      continue
    }

    const { name, ...rest } = parameter
    result[name] = rest
  }

  return result
}

/** `stream: { framing, read, write }` → `channels['/']` with subscribe/publish. Framing is dropped. */
function upgradeStream(document: UnknownObject): void {
  if (!isObject(document.stream)) {
    return
  }

  const channel: UnknownObject = {}
  if (Array.isArray(document.stream.read)) {
    channel.subscribe = { message: { oneOf: document.stream.read } }
  }
  if (Array.isArray(document.stream.write)) {
    channel.publish = { message: { oneOf: document.stream.write } }
  }

  const channels = isObject(document.channels) ? document.channels : {}
  channels[ROOT_CHANNEL] = channel
  document.channels = channels
  delete document.stream
}

/** `events: { receive, send }` → `channels['/']` with subscribe/publish. */
function upgradeEvents(document: UnknownObject): void {
  if (!isObject(document.events)) {
    return
  }

  const channel: UnknownObject = {}
  if (Array.isArray(document.events.receive)) {
    channel.subscribe = { message: { oneOf: document.events.receive } }
  }
  if (Array.isArray(document.events.send)) {
    channel.publish = { message: { oneOf: document.events.send } }
  }

  const channels = isObject(document.channels) ? document.channels : {}
  channels[ROOT_CHANNEL] = channel
  document.channels = channels
  delete document.events
}
