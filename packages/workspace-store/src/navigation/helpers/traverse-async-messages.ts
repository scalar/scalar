import type { AsyncApiComponentsObject, AsyncApiDocument, AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'

import type { TraverseSpecOptions } from '@/navigation/types'
import type { TraversedMessage } from '@/schemas/navigation'

/**
 * Traverse `components.messages` on an AsyncAPI document and emit one
 * `TraversedMessage` entry per message.
 *
 * Mirrors `traverseSchemas` (the OpenAPI Models equivalent) — flat list, no
 * `x-tags` grouping for the MVP.
 */
export const traverseAsyncMessages = ({
  document,
  generateId,
  documentId,
}: {
  document: AsyncApiDocument
  generateId: TraverseSpecOptions['generateId']
  documentId: string
}): TraversedMessage[] => {
  // `components` and each message may arrive as `$ref` objects; the workspace
  // store's magic proxy resolves them transparently at runtime.
  const components = document.components as AsyncApiComponentsObject | undefined
  const messages = components?.messages ?? {}
  const entries: TraversedMessage[] = []

  for (const name in messages) {
    if (!Object.hasOwn(messages, name)) {
      continue
    }

    const message = messages[name] as AsyncApiMessageObject | undefined
    const ref = `#/components/messages/${name}`
    const title = message?.title ?? message?.name ?? name

    entries.push({
      id: generateId({ type: 'message', parentId: documentId, name }),
      title,
      name,
      ref,
      type: 'message',
    })
  }

  return entries
}
