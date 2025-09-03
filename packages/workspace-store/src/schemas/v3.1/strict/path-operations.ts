import { CallbackObjectSchema as C } from '@/schemas/v3.1/strict/callback'
import { OperationObjectSchema as O } from '@/schemas/v3.1/strict/operation'
import { PathItemObjectSchema as P } from '@/schemas/v3.1/strict/path-item'
import { Type, type Static } from '@scalar/typebox'

const Module = Type.Module({
  PathItem: P,
  Operation: O,
  Callback: C,
})

/**
 * Schema for OpenAPI v3.1 Operation objects
 */
export const OperationObjectSchema = Module.Import('Operation')
export type OperationObject = Static<typeof OperationObjectSchema>

/**
 * Schema for OpenAPI v3.1 Callback objects
 */
export const CallbackObjectSchema = Module.Import('Callback')
export type CallbackObject = Static<typeof CallbackObjectSchema>

/**
 * Schema for OpenAPI v3.1 PathItem objects
 */
export const PathItemObjectSchema = Module.Import('PathItem')
export type PathItemObject = Static<typeof PathItemObjectSchema>
