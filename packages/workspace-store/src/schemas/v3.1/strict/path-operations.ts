import { callbackObjectSchemaBuilder } from '@/schemas/v3.1/strict/callback'
import { operationObjectSchemaBuilder } from '@/schemas/v3.1/strict/operation'
import type { ParameterObjectSchema } from '@/schemas/v3.1/strict/parameter'
import { pathItemObjectSchemaBuilder } from '@/schemas/v3.1/strict/path-item'
import type { ReferenceType } from '@/schemas/v3.1/strict/reference'
import type { ServerObjectSchema } from '@/schemas/v3.1/strict/server'
import {
  Type,
  type Static,
  type TArray,
  type TObject,
  type TOptional,
  type TRecord,
  type TRecursive,
  type TString,
  type TUnion,
} from '@sinclair/typebox'

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
) as TRecursive<TRecord<TString, TUnion<[typeof PathItemObjectSchema, ReferenceType<typeof PathItemObjectSchema>]>>>

/** Describes the operations available on a single path. A Path Item MAY be empty, due to ACL constraints. The path itself is still exposed to the documentation viewer but they will not know which operations and parameters are available. */
export const PathItemObjectSchema = Type.Recursive((This) =>
  pathItemObjectSchemaBuilder(operationObjectSchemaBuilder(callbackObjectSchemaBuilder(This))),
) satisfies TRecursive<
  TObject<{
    $ref: TOptional<TString>
    summary: TOptional<TString>
    description: TOptional<TString>
    get: TOptional<TRecursive<typeof OperationObjectSchema>>
    put: TOptional<TRecursive<typeof OperationObjectSchema>>
    post: TOptional<TRecursive<typeof OperationObjectSchema>>
    delete: TOptional<TRecursive<typeof OperationObjectSchema>>
    patch: TOptional<TRecursive<typeof OperationObjectSchema>>
    connect: TOptional<TRecursive<typeof OperationObjectSchema>>
    options: TOptional<TRecursive<typeof OperationObjectSchema>>
    head: TOptional<TRecursive<typeof OperationObjectSchema>>
    trace: TOptional<TRecursive<typeof OperationObjectSchema>>
    servers: TOptional<TArray<typeof ServerObjectSchema>>
    parameters: TOptional<TArray<TUnion<[typeof ParameterObjectSchema, ReferenceType<typeof ParameterObjectSchema>]>>>
  }>
>

export type PathItemObject = Static<typeof PathItemObjectSchema>

export type CallbackObject = Static<typeof CallbackObjectSchema>

export type OperationObject = Static<typeof OperationObjectSchema>
