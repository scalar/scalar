import { type Operation, XScalarStability } from '@scalar/types/legacy'

/**
 * Returns if an operation is considered deprecated.
 */
export function isOperationDeprecated(operation: Operation): boolean {
  if (operation.information?.deprecated !== undefined)
    return operation.information?.deprecated
  if (
    operation.information?.['x-scalar-stability'] &&
    operation.information['x-scalar-stability'] === XScalarStability.Deprecated
  )
    return true
  return false
}

/**
 * Get operation stability.
 */
export function getOperationStability(
  operation: Operation,
): XScalarStability | undefined {
  if (operation.information?.deprecated) return XScalarStability.Deprecated
  return operation.information?.['x-scalar-stability']
}

/**
 * Get Operation stability color
 */
export function getOperationStabilityColor(operation: Operation): string {
  const stability = getOperationStability(operation)
  if (stability === XScalarStability.Deprecated) return 'red'
  if (stability === XScalarStability.Experimental) return 'orange'
  if (stability === XScalarStability.Stable) return 'green'
  return ''
}
