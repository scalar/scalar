import { object, optional, string } from '@scalar/validation'

import { createAsyncApiChannelSchemas } from './channel'
import { createAsyncApiComponentsObject } from './components'
import { createAsyncApiInfoObject } from './info'
import { createAsyncApiOperationSchemas } from './operation'
import { type MaybeRefFn, normalRef } from './reference'
import { createAsyncApiServerSchemas } from './server'

/**
 * Builds the root AsyncAPI 3.1 document (A2S) schema.
 *
 * Wires sub-schemas from other `create*` factories with the same `maybeRef` so reference
 * handling stays consistent across the document.
 *
 * **Reference union (root only):** The `components` field is `Components Object | Reference
 * Object`. Other top-level sections (`channels`, `operations`, `servers`) use maps whose values
 * are already reference unions from their `create*` factories.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiObjectSchema = (maybeRef: MaybeRefFn) => {
  const info = createAsyncApiInfoObject(maybeRef)
  const { serversObject } = createAsyncApiServerSchemas(maybeRef)
  const { channelsObject } = createAsyncApiChannelSchemas(maybeRef)
  const { operationsObject } = createAsyncApiOperationSchemas(maybeRef)
  const components = createAsyncApiComponentsObject(maybeRef)

  return object(
    {
      asyncapi: string({
        typeComment: 'REQUIRED. AsyncAPI Specification version (major.minor.patch). Patch MAY include a hyphen suffix.',
      }),
      id: optional(
        string({
          typeComment: 'Identifier of the application the AsyncAPI document is defining (URI, RFC3986).',
        }),
      ),
      info,
      servers: optional(serversObject),
      defaultContentType: optional(
        string({
          typeComment: 'Default content type when encoding/decoding a message payload (for example application/json).',
        }),
      ),
      channels: optional(channelsObject),
      operations: optional(operationsObject),
      components: optional(maybeRef(components)),
    },
    {
      typeName: 'AsyncApiObject',
      typeComment: 'Root AsyncAPI 3.1.0 document combining resource listing and API declaration.',
    },
  )
}

const defaultObjectSchema = createAsyncApiObjectSchema(normalRef)

/**
 * Root AsyncAPI 3.1.0 document object (the A2S / AsyncAPI Object).
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0#A2SObject
 */
export const asyncApiObjectSchema = defaultObjectSchema

/** Alias matching the specification term “A2S” (AsyncAPI Specification) root object. */
export const asyncApiA2sObjectSchema = defaultObjectSchema
