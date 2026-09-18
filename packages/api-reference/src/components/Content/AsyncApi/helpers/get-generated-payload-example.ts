import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'

import { getAsyncApiMessagePayloadSchema } from '@/helpers/get-async-api-message-payload-schema'

/**
 * Snapshot each schema object once, retaining shared and recursive references.
 * Unpacking is shallow: use the raw object only for identity and ownership, then
 * read through the proxy so reactive edits remain tracked and references resolve.
 * Synthetic reference targets stay accessible to the generator but are omitted
 * when literal example data is serialized.
 */
const snapshotSchema = <T>(source: T, seen = new WeakMap<object, object>()): T => {
  if (typeof source !== 'object' || source === null) {
    return source
  }

  const raw = unpackProxyObject(source)
  const existing = seen.get(raw)
  if (existing) {
    return existing as T
  }

  const snapshot = Array.isArray(source) ? [] : {}
  seen.set(raw, snapshot)
  for (const key of Object.keys(source)) {
    // Data descriptors also preserve literal __proto__ and inherited accessor names.
    Object.defineProperty(snapshot, key, {
      value: snapshotSchema(Reflect.get(source, key), seen),
      enumerable: key !== '$ref-value' || Object.hasOwn(raw, key),
      configurable: true,
      writable: true,
    })
  }
  return snapshot as T
}

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
  const snapshot = snapshotSchema(schema)
  return getExampleFromSchema(snapshot, {
    emptyString: 'string',
    // Match the message schema, which displays fields regardless of their read/write annotations.
    includeDeprecated: true,
  })
}
