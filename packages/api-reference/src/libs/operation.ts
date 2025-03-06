import type { Operation } from '@scalar/oas-utils/entities/spec'
import { XScalarStability } from '@scalar/types/legacy'

/**
 * Returns if an operation is considered deprecated.
 */
export function isOperationDeprecated(operation: Pick<Operation, 'deprecated' | 'x-scalar-stability'>): boolean {
  if (operation.deprecated !== undefined) return operation.deprecated
  if (operation['x-scalar-stability'] && operation['x-scalar-stability'] === XScalarStability.Deprecated) return true
  return false
}

/**
 * Get operation stability.
 */
export function getOperationStability(
  operation: Pick<Operation, 'deprecated' | 'x-scalar-stability'>,
): XScalarStability | undefined {
  if (operation.deprecated) return XScalarStability.Deprecated
  return operation['x-scalar-stability']
}

/**
 * Get Operation stability color
 */
export function getOperationStabilityColor(operation: Pick<Operation, 'deprecated' | 'x-scalar-stability'>): string {
  const stability = getOperationStability(operation)
  if (stability === XScalarStability.Deprecated) return 'text-red'
  if (stability === XScalarStability.Experimental) return 'text-orange'
  if (stability === XScalarStability.Stable) return 'text-green'
  return ''
}
