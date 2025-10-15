import { Type } from '@scalar/typebox'

import { OperationSchemaDefinition } from './operation'

// Operations Object Schema - map of operation IDs to operations
export const OperationsObjectSchemaDefinition = Type.Record(Type.String(), OperationSchemaDefinition)

export type OperationsObject = Record<string, import('./operation').Operation>
