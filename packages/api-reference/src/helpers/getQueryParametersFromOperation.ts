import type { TransformedOperation } from '../types'

/**
 * Get the query parameters from an operation.
 *
 * Example: [ { name: 'foobar', value: '' } ]
 */
export function getQueryParametersFromOperation(
  operation: TransformedOperation,
): any {
  const parameters = [
    ...(operation.information?.parameters || []),
    ...(operation.pathParameters || []),
  ]

  return parameters
    .filter((parameter) => parameter.in === 'query')
    .map((parameter) => ({
      name: parameter.name,
      value: '',
    }))
}
