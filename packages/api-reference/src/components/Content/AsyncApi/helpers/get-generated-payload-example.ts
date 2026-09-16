import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'

import { getAsyncApiMessagePayloadSchema } from '@/helpers/get-async-api-message-payload-schema'

/** Generate a payload only when the document does not already provide one. */
export const getGeneratedPayloadExample = (message: AsyncApiMessageObject): unknown => {
  if (message.examples?.some((example) => getResolvedRef(example)?.payload !== undefined)) {
    return undefined
  }

  const payload = getResolvedRef(message.payload)
  if (isObject(payload) && 'schemaFormat' in payload) {
    // Avro and other formats can also be objects, but the shared generator only understands JSON Schema.
    const mediaType = String(payload.schemaFormat).split(';')[0]?.trim().toLowerCase()
    if (
      ![
        'application/schema+json',
        'application/schema+yaml',
        'application/vnd.aai.asyncapi+json',
        'application/vnd.aai.asyncapi+yaml',
      ].includes(mediaType ?? '')
    ) {
      return undefined
    }
  }

  const schema = getAsyncApiMessagePayloadSchema(message)
  if (!schema) {
    return undefined
  }

  // Snapshot reactive schemas so in-place edits do not reuse the generator's identity cache.
  // The generator resolves schema references itself, preserving literal $ref fields in payload data.
  return getExampleFromSchema(deepClone(schema), {
    emptyString: 'string',
    // Match the message schema, which displays fields regardless of their read/write annotations.
    includeDeprecated: true,
  })
}
