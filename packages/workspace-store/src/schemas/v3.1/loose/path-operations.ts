import {
  Type,
  type TArray,
  type TObject,
  type TOptional,
  type TRecord,
  type TRecursive,
  type TString,
  type TUnion,
} from '@scalar/typebox'

import { callbackObjectSchemaBuilder } from './callback'
import { operationObjectSchemaBuilder } from './operation'
import { pathItemObjectSchemaBuilder } from './path-item'
import type { ReferenceObjectSchema } from '@/schemas/v3.1/loose/reference'
import type { ServerObjectSchema } from '@/schemas/v3.1/loose/server'
import type { ParameterObjectSchema } from '@/schemas/v3.1/loose/parameter'

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
) as TRecursive<TRecord<TString, TUnion<[typeof PathItemObjectSchema, typeof ReferenceObjectSchema]>>>

/** Describes the operations available on a single path. A Path Item MAY be empty, due to ACL constraints. The path itself is still exposed to the documentation viewer but they will not know which operations and parameters are available. */
export const PathItemObjectSchema = Type.Recursive((This) =>
  pathItemObjectSchemaBuilder(operationObjectSchemaBuilder(callbackObjectSchemaBuilder(This))),
) as TRecursive<
  TObject<{
    $ref: TOptional<TString>
    summary: TOptional<TString>
    description: TOptional<TString>
    get: TOptional<typeof OperationObjectSchema>
    put: TOptional<typeof OperationObjectSchema>
    post: TOptional<typeof OperationObjectSchema>
    delete: TOptional<typeof OperationObjectSchema>
    patch: TOptional<typeof OperationObjectSchema>
    connect: TOptional<typeof OperationObjectSchema>
    options: TOptional<typeof OperationObjectSchema>
    head: TOptional<typeof OperationObjectSchema>
    trace: TOptional<typeof OperationObjectSchema>
    servers: TOptional<TArray<typeof ServerObjectSchema>>
    parameters: TOptional<TArray<TUnion<[typeof ParameterObjectSchema, typeof ReferenceObjectSchema]>>>
  }>
>
