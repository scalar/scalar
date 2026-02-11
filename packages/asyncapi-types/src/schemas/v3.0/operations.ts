import { Type } from '@scalar/typebox'

import { reference } from '@/openapi-types/v3.1/strict/reference'

import { OperationRef } from './ref-definitions'

/**
 * Holds a dictionary with all the operations this application MUST implement.
 */
export const OperationsObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([OperationRef, reference(OperationRef)]),
)
