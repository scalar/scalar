import { XScalarStability } from '@scalar/types/legacy'

type OperationStability = {
  deprecated?: boolean
  'x-scalar-stability'?: unknown
}

/**
 * Returns true if an operation is considered deprecated.
 */
export const isOperationDeprecated = (operation: OperationStability): boolean =>
  operation.deprecated || operation['x-scalar-stability'] === XScalarStability.Deprecated

/**
 * Get operation stability from deprecated or x-scalar-stability
 */
export const getOperationStability = (operation: OperationStability): XScalarStability | undefined =>
  operation.deprecated
    ? XScalarStability.Deprecated
    : (operation['x-scalar-stability'] as XScalarStability | undefined)

/**
 * Get Operation stability tailwind color class
 */
export const getOperationStabilityColor = (operation: OperationStability): string => {
  switch (getOperationStability(operation)) {
    case XScalarStability.Deprecated:
      return 'text-red'
    case XScalarStability.Experimental:
      return 'text-orange'
    case XScalarStability.Stable:
      return 'text-green'
    default:
      return ''
  }
}
