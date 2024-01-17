import type { BaseParameter } from '@scalar/api-client'

import type { TransformedOperation } from '../types'
import { getExampleFromSchema } from './getExampleFromSchema'

/**
 * Get the query parameters from an operation.
 *
 * Example: [ { name: 'foobar', value: '' } ]
 *
 * - OpenAPI 3.x: Possible values are “query”, “header”, “path” or “cookie”.
 * - Swagger 2.0: Possible values are "query", "header", "path", "formData" or "body".
 */
export function getParametersFromOperation(
  operation: TransformedOperation,
  where: 'query' | 'header' | 'path' | 'cookie' | 'formData' | 'body',
  requiredOnly: boolean = true,
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
      .filter(
        (parameter) => (requiredOnly && parameter.required) || !requiredOnly,
      )
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
