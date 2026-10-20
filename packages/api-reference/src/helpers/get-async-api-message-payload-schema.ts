import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { resolveAsyncApiSchema } from './resolve-async-api-schema'

/** Resolve only schemas understood by the shared JSON Schema renderer and its helpers. */
export const unwrapAsyncApiSchema = (value: unknown): SchemaObject | undefined => {
  const resolved = resolveAsyncApiSchema(value)
  return resolved?.kind === 'schema' ? resolved.schema : undefined
}

/** Resolves a JSON Schema message payload for example generation. */
export const getAsyncApiMessagePayloadSchema = (message: AsyncApiMessageObject): SchemaObject | undefined =>
  unwrapAsyncApiSchema(message.payload)

/** Resolves a JSON Schema message header definition. */
export const getAsyncApiMessageHeadersSchema = (message: AsyncApiMessageObject): SchemaObject | undefined =>
  unwrapAsyncApiSchema(message.headers)
