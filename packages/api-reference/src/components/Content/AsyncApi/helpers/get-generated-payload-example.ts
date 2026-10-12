import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import { snapshotSchema } from '@scalar/workspace-store/helpers/snapshot-schema'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'

import { getAsyncApiMessagePayloadSchema } from '@/helpers/get-async-api-message-payload-schema'

/** An allOf containing a false schema cannot have a valid example. */
const hasFalseAllOfMember = (source: unknown, seen = new Set<unknown>()): boolean => {
  const schema = getResolvedAsyncApiRef(source)
  if (schema === false) {
    return true
  }
  if (!isObject(schema) || seen.has(schema)) {
    return false
  }
  seen.add(schema)
  return Array.isArray(schema.allOf) && schema.allOf.some((member) => hasFalseAllOfMember(member, seen))
}

/** Generate a payload only when the document does not already provide one. */
export const getGeneratedPayloadExample = (message: AsyncApiMessageObject): unknown => {
  if (message.examples?.some((example) => getResolvedAsyncApiRef(example)?.payload !== undefined)) {
    return undefined
  }

  const payload = getResolvedAsyncApiRef(message.payload)
  // Boolean schemas describe validation, but do not suggest a representative payload.
  if (
    typeof payload === 'boolean' ||
    (isObject(payload) && 'schemaFormat' in payload && typeof getResolvedAsyncApiRef(payload.schema) === 'boolean')
  ) {
    return undefined
  }

  const schema = getAsyncApiMessagePayloadSchema(message)
  if (!schema || hasFalseAllOfMember(schema)) {
    return undefined
  }

  // Snapshot reactive schemas so in-place edits do not reuse the generator's identity cache.
  // The generator resolves schema references itself, preserving literal $ref fields in payload data.
  const snapshot = snapshotSchema(schema)
  return getExampleFromSchema(snapshot, {
    emptyString: 'string',
    // Match the message schema, which displays fields regardless of their read/write annotations.
    includeDeprecated: true,
  })
}
