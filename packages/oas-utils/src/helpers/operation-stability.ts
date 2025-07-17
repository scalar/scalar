import { XScalarStabilityValues } from '@scalar/openapi-types/schemas/extensions'

type OperationStability = {
  deprecated?: boolean
  'x-scalar-stability'?: unknown
}

/**
 * Returns true if an operation is considered deprecated.
 */
export const isOperationDeprecated = (operation: OperationStability): boolean =>
  operation.deprecated || operation['x-scalar-stability'] === XScalarStabilityValues.Deprecated

/**
 * Get operation stability from deprecated or x-scalar-stability
 */
export const getOperationStability = (operation: OperationStability): XScalarStabilityValues | undefined =>
  operation.deprecated
    ? XScalarStabilityValues.Deprecated
    : (operation['x-scalar-stability'] as XScalarStabilityValues | undefined)

/**
 * Get Operation stability tailwind color class
 */
export const getOperationStabilityColor = (operation: OperationStability): string => {
  switch (getOperationStability(operation)) {
    case XScalarStabilityValues.Deprecated:
      return 'text-red'
    case XScalarStabilityValues.Experimental:
      return 'text-orange'
    case XScalarStabilityValues.Stable:
      return 'text-green'
    default:
      return ''
  }
}
