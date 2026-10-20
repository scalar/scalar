import type { AsyncApiChannelObject, AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import { resolveAsyncApiChannel, resolveAsyncApiMessage, resolveAsyncApiOperation } from './resolve-async-api-nodes'

/** Tag declarations share the same shape at every AsyncAPI scope. */
export type AsyncApiTags = AsyncApiChannelObject['tags']

type ResolvedTag = {
  name: string
  description?: string
  externalDocs?: { url: string; description?: string }
}

/** Resolve tag references without conflating same-name tags on different owners. */
export const getAsyncApiTags = (tags: AsyncApiTags): ResolvedTag[] =>
  (tags ?? []).flatMap((node) => {
    const tag = getResolvedRef(node)
    if (
      !tag?.name ||
      ('x-internal' in tag && tag['x-internal']) ||
      ('x-scalar-ignore' in tag && tag['x-scalar-ignore'])
    ) {
      return []
    }
    return [
      {
        name: tag.name,
        description: tag.description,
        externalDocs: tag.externalDocs ? getResolvedRef(tag.externalDocs) : undefined,
      },
    ]
  })

/** Read effective tags from the same resolved objects used by the content renderers. */
export const getAsyncApiEntryTags = (entry: TraversedEntry, document: AsyncApiDocument): AsyncApiTags => {
  if (entry.type === 'asyncapi-channel') {
    return resolveAsyncApiChannel(document, entry.channelName)?.tags
  }
  if (entry.type === 'asyncapi-operation') {
    return resolveAsyncApiOperation(document, entry.operationName)?.tags
  }
  if (entry.type === 'asyncapi-message') {
    return resolveAsyncApiMessage(document, entry.channelName, entry.messageName)?.tags
  }
  return undefined
}
