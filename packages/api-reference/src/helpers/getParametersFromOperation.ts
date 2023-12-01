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
): BaseParameter {
  const parameters = [
    ...(operation.information?.parameters || []),
    ...(operation.pathParameters || []),
  ]

  console.log({ parameters })

  return parameters
    .filter((parameter) => parameter.in === where)
    .map((parameter) => ({
      name: parameter.name,
      description: parameter.description ?? null,
      value: parameter.example
        ? parameter.example
        : parameter.schema
        ? getExampleFromSchema(parameter.schema)
        : '',
      required: parameter.required ?? false,
    }))
}
