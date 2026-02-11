import type { ReferenceType } from '@/openapi-types/v3.1/strict/reference'

import type { ParameterObject } from './parameter'

/**
 * Parameters Object - A map of Parameter Objects.
 * The keys are parameter names and the values are Parameter Objects or references to them.
 */
export type ParametersObject = Record<string, ReferenceType<ParameterObject>>
