import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Operation } from '@/entities/spec'
import { getExampleFromSchema } from './get-example-from-schema'

/**
 * Get the query parameters from an operation.
 *
 * Example: [ { name: 'foobar', value: '' } ]
 *
 * - OpenAPI 3.x: Possible values are "query", "header", "path" or "cookie".
 */
export function getParametersFromOperation(
  operationParameters: Operation['parameters'] = [],
  pathParameters: OpenAPIV3_1.ParameterObject[] = [],
  where: 'query' | 'header' | 'path' | 'cookie' | 'formData' | 'body',
  requiredOnly: boolean = true,
) {
  const parameters = [...(pathParameters || []), ...(operationParameters || [])]

  const params = parameters
    // query, path, header, cookie?
    .filter((parameter) => parameter.in === where)
    // don't add optional parameters
    .filter((parameter) => (requiredOnly && parameter.required) || !requiredOnly)
    // transform them
    .map((parameter) => ({
      name: parameter.name ?? 'Unknown Parameter',
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
    // Move a up if a is required and b is not
    if (a.required && !b.required) {
      return -1
    }
    // Move b up if b is required and a is not
    if (!a.required && b.required) {
      return 1
    }
    // Keep original order if both have the same required status
    return 0
  })
}
