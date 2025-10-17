import { Type } from '@scalar/typebox'

import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'

import type { ParameterObject } from './parameter'
import { ParameterObjectRef } from './ref-definitions'

/**
 * Parameters Object - A map of Parameter Objects.
 * The keys are parameter names and the values are Parameter Objects or references to them.
 */
export const ParametersObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([ParameterObjectRef, reference(ParameterObjectRef)]),
)

/**
 * Parameters Object - A map of Parameter Objects.
 * The keys are parameter names and the values are Parameter Objects or references to them.
 */
export type ParametersObject = Record<string, ReferenceType<ParameterObject>>
