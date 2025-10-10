import { Type } from '@scalar/typebox'

import { OperationSchema } from './operation'

// Operations Object Schema - map of operation IDs to operations
const OperationsObjectSchemaDefinition = Type.Record(Type.String(), OperationSchema)

export type OperationsObject = Record<string, import('./operation').Operation>

// Module definition
const module = Type.Module({
  OperationsObject: OperationsObjectSchemaDefinition,
})

// Export schemas
export const OperationsObjectSchema = module.Import('OperationsObject')
