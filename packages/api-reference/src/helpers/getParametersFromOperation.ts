import type { BaseParameter } from '@scalar/api-client'

import type { TransformedOperation } from '../types'
import { getExampleFromSchema } from './getExampleFromSchema'

/**
 * Get the query parameters from an operation.
 *
 * Example: [ { name: 'foobar', value: '' } ]
 */
export function getParametersFromOperation(
  operation: TransformedOperation,
  where: 'query' | 'path' | 'header' | 'cookie',
): BaseParameter[] {
  const parameters = [
    ...(operation.pathParameters || []),
    ...(operation.information?.parameters || []),
  ]

  return (
    parameters
      // query, path, header, cookie?
      .filter((parameter) => parameter.in === where)
      // don’t add optional parameters
      .filter((parameter) => parameter.required)
      // transform them
      .map((parameter) => ({
        name: parameter.name,
        description: parameter.description ?? null,
        value: parameter.example
          ? parameter.example
          : parameter.schema
          ? getExampleFromSchema(parameter.schema)
          : '',
        required: parameter.required ?? false,
        enabled: true,
      }))
  )
}
