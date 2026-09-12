import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'

import type { MockMessage, ResolvedChannel, ResolvedMessage } from '@/transports/types'
import { type ExampleSchema, generateResponseExample } from '@/utils/generate-response-example'

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
 * message payload schema through the same `generateResponseExample` the HTTP mocker uses.
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
    // No `variables`: `generateMessage` is never handed the Hono context, so a channel route's path
    // parameters are not in scope for `x-variable` substitution. It does run per request.
    value = generateResponseExample(getResolvedRefDeep(message.payload) as ExampleSchema)
  }

  return {
    data: encode(value),
    event: message.id,
  }
}
