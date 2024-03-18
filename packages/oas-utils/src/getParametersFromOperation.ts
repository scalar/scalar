import { getExampleFromSchema } from './getExampleFromSchema'
import type { BaseParameter, TransformedOperation } from './types'

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

  const params = parameters
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
          ? getExampleFromSchema(parameter.schema, { mode: 'write' })
          : '',
      required: parameter.required ?? false,
      enabled: parameter.required ?? false,
    }))

  return params.sort((a, b) => {
    if (a.required && !b.required) {
      return -1 // Move a up if a is required and b is not
    } else if (!a.required && b.required) {
      return 1 // Move b up if b is required and a is not
    }
    return 0 // Keep original order if both have the same required status
  })
}
