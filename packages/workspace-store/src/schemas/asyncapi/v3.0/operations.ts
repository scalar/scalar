import { Type } from '@scalar/typebox'

import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'

import type { Operation } from './operation'
import { OperationRef } from './ref-definitions'

/**
 * Holds a dictionary with all the operations this application MUST implement.
 */
export const OperationsObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([OperationRef, reference(OperationRef)]),
)

/**
 * Holds a dictionary with all the operations this application MUST implement.
 */
export type OperationsObject = Record<string, ReferenceType<Operation>>
