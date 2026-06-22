import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'

import type { MockMessage, ResolvedChannel, ResolvedMessage } from '@/transports/types'

/** Encode a generated value to a wire string. Strings pass through; everything else is JSON. */
function encode(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value ?? null)
}

/**
 * Generate an encoded mock frame for a channel message — the AsyncAPI analogue of the REST
 * mocker's response generation. Prefers a defined example, otherwise generates a value from the
 * message payload schema with the same `getExampleFromSchema` the HTTP mocker uses.
 *
 * @param channel - The resolved channel to mock a message for.
 * @param messageId - Which message to emit; defaults to the channel's first message.
 * @returns The encoded message, or `null` when the channel declares no messages.
 */
export function generateMessage(channel: ResolvedChannel, messageId?: string): MockMessage | null {
  const message: ResolvedMessage | undefined = messageId
    ? channel.messages.find((candidate) => candidate.id === messageId)
    : channel.messages[0]

  if (!message) {
    return null
  }

  let value: unknown = null
  if (message.examples.length > 0) {
    // Prefer an explicit example, mirroring response-example selection in the REST mocker.
    value = message.examples[0]
  } else if (message.payload) {
    value = getExampleFromSchema(getResolvedRefDeep(message.payload) as Parameters<typeof getExampleFromSchema>[0], {
      emptyString: 'string',
      mode: 'read',
    })
  }

  return {
    data: encode(value),
    event: message.id,
  }
}
