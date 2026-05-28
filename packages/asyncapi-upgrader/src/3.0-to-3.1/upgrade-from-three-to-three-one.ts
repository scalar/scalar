import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/** The AsyncAPI version produced by this upgrade step. */
const ASYNCAPI_VERSION = '3.1.0'

const COMPONENT_MESSAGE_REF = /^#\/components\/messages\/(.+)$/

/**
 * Upgrade an AsyncAPI 3.0 document to 3.1.0.
 *
 * 3.1 is a clarification release — the only real schema rule it tightens is that operation
 * `messages` $refs MUST use the channel-scoped form (`#/channels/{id}/messages/{name}`). The 3.0
 * spec's own examples used the components-scoped form, so many real-world 3.0 documents do too.
 * We canonicalize on upgrade and pull the referenced message into the channel's `messages` map if
 * it isn't already there.
 */
export function upgradeFromThreeToThreeOne(originalDocument: UnknownObject): UnknownObject {
  const document = originalDocument

  if (!isObject(document) || typeof document.asyncapi !== 'string' || !document.asyncapi.startsWith('3.0')) {
    return document
  }

  document.asyncapi = ASYNCAPI_VERSION
  rewriteOperationMessageRefs(document)

  return document
}

/**
 * For every operation with a channel `$ref`, rewrite any `#/components/messages/{name}` entry in
 * its `messages` (and `reply.messages`) to `#/channels/{channelId}/messages/{name}`, registering
 * the message on the channel if needed.
 */
function rewriteOperationMessageRefs(document: UnknownObject): void {
  if (!isObject(document.operations) || !isObject(document.channels)) {
    return
  }

  const channels = document.channels

  for (const operation of Object.values(document.operations)) {
    if (!isObject(operation)) {
      continue
    }

    rewriteMessageList(operation.messages, operation.channel, channels)

    if (isObject(operation.reply)) {
      // Reply's `channel` is optional in 3.0 — when omitted, the reply runs on the parent
      // operation's channel.
      rewriteMessageList(operation.reply.messages, operation.reply.channel ?? operation.channel, channels)
    }
  }
}

/**
 * Rewrites every `#/components/messages/{name}` entry in `messageList` in-place, given the channel
 * reference that the surrounding operation/reply points at.
 */
function rewriteMessageList(messageList: unknown, channelRef: unknown, channels: UnknownObject): void {
  if (!Array.isArray(messageList)) {
    return
  }

  const channelId = extractChannelId(channelRef)
  if (!channelId) {
    return
  }

  const channel = channels[channelId]
  if (!isObject(channel)) {
    return
  }

  for (let i = 0; i < messageList.length; i += 1) {
    const entry = messageList[i]
    if (!isObject(entry) || typeof entry.$ref !== 'string') {
      continue
    }

    const [, messageName] = entry.$ref.match(COMPONENT_MESSAGE_REF) ?? []
    if (!messageName) {
      continue
    }

    registerChannelMessage(channel, messageName, entry.$ref)
    messageList[i] = { $ref: `#/channels/${channelId}/messages/${messageName}` }
  }

  dedupeRefs(messageList)
}

/** Removes duplicate `{ $ref: 'X' }` entries (keeps the first occurrence). Mutates `list`. */
function dedupeRefs(list: unknown[]): void {
  const seen = new Set<string>()
  let writeIndex = 0
  for (const entry of list) {
    if (isObject(entry) && typeof entry.$ref === 'string') {
      if (seen.has(entry.$ref)) {
        continue
      }
      seen.add(entry.$ref)
    }
    list[writeIndex] = entry
    writeIndex += 1
  }
  list.length = writeIndex
}

/** Returns the channel id from a `{ $ref: '#/channels/{id}' }` value, or `undefined` for anything else. */
function extractChannelId(channelRef: unknown): string | undefined {
  if (!isObject(channelRef) || typeof channelRef.$ref !== 'string') {
    return undefined
  }
  const match = channelRef.$ref.match(/^#\/channels\/([^/]+)$/)
  return match ? match[1] : undefined
}

/** Ensures `channel.messages[name]` exists, defaulting to a `$ref` pointing at the original component message. */
function registerChannelMessage(channel: UnknownObject, name: string, componentRef: string): void {
  if (!isObject(channel.messages)) {
    channel.messages = {}
  }
  const messages = channel.messages as UnknownObject
  if (!(name in messages)) {
    messages[name] = { $ref: componentRef }
  }
}
