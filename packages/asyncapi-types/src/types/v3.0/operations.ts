import type { ReferenceType } from '@/openapi-types/v3.1/strict/reference'

import type { OperationObject } from './operation'

/**
 * Holds a dictionary with all the operations this application MUST implement.
 */
export type OperationsObject = Record<string, ReferenceType<OperationObject>>
