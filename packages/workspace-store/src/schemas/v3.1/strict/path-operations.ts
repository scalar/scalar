import { callbackObjectSchemaBuilder } from '@/schemas/v3.1/strict/callback'
import { operationObjectSchemaBuilder } from '@/schemas/v3.1/strict/operation'
import { pathItemObjectSchemaBuilder } from '@/schemas/v3.1/strict/path-item'
import { Type, type Static } from '@sinclair/typebox'

export const OperationObjectSchema = Type.Recursive((This) =>
  operationObjectSchemaBuilder(callbackObjectSchemaBuilder(pathItemObjectSchemaBuilder(This))),
)

/**
 * A map of possible out-of band callbacks related to the parent operation. Each value in the map is a Path Item Object that describes a set of requests that may be initiated by the API provider and the expected responses. The key value used to identify the Path Item Object is an expression, evaluated at runtime, that identifies a URL to use for the callback operation.
 *
 * To describe incoming requests from the API provider independent from another API call, use the webhooks field.
 */
export const CallbackObjectSchema = Type.Recursive((This) =>
  callbackObjectSchemaBuilder(pathItemObjectSchemaBuilder(operationObjectSchemaBuilder(This))),
)

/** Describes the operations available on a single path. A Path Item MAY be empty, due to ACL constraints. The path itself is still exposed to the documentation viewer but they will not know which operations and parameters are available. */
export const PathItemObjectSchema = Type.Recursive((This) =>
  pathItemObjectSchemaBuilder(operationObjectSchemaBuilder(callbackObjectSchemaBuilder(This))),
)

export type PathItemObject = Static<typeof PathItemObjectSchema>

export type CallbackObject = Static<typeof CallbackObjectSchema>

export type OperationObject = Static<typeof OperationObjectSchema>
