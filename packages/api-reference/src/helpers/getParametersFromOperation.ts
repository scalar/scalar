import type { TransformedOperation } from '../types'

/**
 * Get the query parameters from an operation.
 *
 * Example: [ { name: 'foobar', value: '' } ]
 */
export function getParametersFromOperation(
  operation: TransformedOperation,
  where: 'query' | 'path' | 'header' | 'cookie',
): any {
  const parameters = [
    ...(operation.information?.parameters || []),
    ...(operation.pathParameters || []),
  ]

  return parameters
    .filter((parameter) => parameter.in === where)
    .map((parameter) => ({
      name: parameter.name,
      // TODO: Can we prefill this?
      value: '',
    }))
}
