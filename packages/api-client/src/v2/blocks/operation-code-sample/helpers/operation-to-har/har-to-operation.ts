import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OperationObject,
  ParameterObject,
  RequestBodyObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/reference'
import type { Request as HarRequest } from 'har-format'

export type HarToOperationProps = {
  /** HAR request to convert */
  harRequest: HarRequest
  /** Name of the example to populate (e.g., 'default', 'example1') */
  exampleKey: string
  /** Optional base operation to merge with */
  baseOperation?: OperationObject
}

/**
 * Converts a HAR request back to an OpenAPI Operation object with populated examples.
 *
 * This function is the reverse of operationToHar - it takes a HAR request and
 * converts it back into an OpenAPI operation structure, populating the example
 * values based on the HAR request data.
 *
 * The conversion handles:
 * - URL parsing to extract path and query parameters
 * - Header extraction and mapping to operation parameters
 * - Query string parsing and mapping to parameters
 * - Cookie extraction and mapping to cookie parameters
 * - Request body extraction and mapping to requestBody with examples
 * - Content-Type detection and media type assignment
 *
 * Note: This function focuses on populating examples and does not reconstruct
 * schema definitions. If you need full schema generation, consider combining
 * this with a schema inference tool.
 *
 * @see https://w3c.github.io/web-performance/specs/HAR/Overview.html
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 */
export const harToOperation = ({
  harRequest,
  exampleKey,
  baseOperation = {},
}: HarToOperationProps): OperationObject => {
  // Ensure parameters array exists
  const parameters: ReferenceType<ParameterObject>[] = baseOperation.parameters ? [...baseOperation.parameters] : []

  const operation: OperationObject = {
    ...baseOperation,
    parameters,
  }

  // Process query string parameters
  if (harRequest.queryString && harRequest.queryString.length > 0) {
    for (const queryParam of harRequest.queryString) {
      const existingParam = findOrCreateParameter(parameters, queryParam.name, 'query')

      // Set the example value for this parameter (only works with schema-based parameters)
      if (isParameterWithSchema(existingParam)) {
        if (!existingParam.examples) {
          existingParam.examples = {}
        }
        existingParam.examples[exampleKey] = {
          value: queryParam.value,
        }
      }
    }
  }

  // Process headers as parameters
  if (harRequest.headers && harRequest.headers.length > 0) {
    // Filter out common headers that are typically not parameterized
    const excludedHeaders = ['content-type', 'accept', 'user-agent', 'host']

    for (const header of harRequest.headers) {
      const headerName = header.name.toLowerCase()

      // Skip common headers and empty values
      if (excludedHeaders.includes(headerName) || !header.value) {
        continue
      }

      const existingParam = findOrCreateParameter(parameters, header.name, 'header')

      // Set the example value for this parameter (only works with schema-based parameters)
      if (isParameterWithSchema(existingParam)) {
        if (!existingParam.examples) {
          existingParam.examples = {}
        }
        existingParam.examples[exampleKey] = {
          value: header.value,
        }
      }
    }
  }

  // Process cookies as parameters
  if (harRequest.cookies && harRequest.cookies.length > 0) {
    for (const cookie of harRequest.cookies) {
      const existingParam = findOrCreateParameter(parameters, cookie.name, 'cookie')

      // Set the example value for this parameter (only works with schema-based parameters)
      if (isParameterWithSchema(existingParam)) {
        if (!existingParam.examples) {
          existingParam.examples = {}
        }
        existingParam.examples[exampleKey] = {
          value: cookie.value,
        }
      }
    }
  }

  // Process request body
  if (harRequest.postData) {
    const contentType = harRequest.postData.mimeType || 'application/json'

    if (!operation.requestBody) {
      operation.requestBody = {
        content: {},
      }
    }

    const requestBody = operation.requestBody as RequestBodyObject

    if (!requestBody.content) {
      requestBody.content = {}
    }

    if (!requestBody.content[contentType]) {
      requestBody.content[contentType] = {
        schema: {
          type: 'object',
        },
      }
    }

    const mediaTypeObject = requestBody.content[contentType]

    if (!mediaTypeObject) {
      return operation
    }

    // Set the example value for this media type
    if (!mediaTypeObject.examples) {
      mediaTypeObject.examples = {}
    }

    // Parse the body based on content type
    let exampleValue: unknown = harRequest.postData.text

    if (contentType.includes('application/json') && harRequest.postData.text) {
      try {
        exampleValue = JSON.parse(harRequest.postData.text)
      } catch {
        // If parsing fails, keep it as text
        exampleValue = harRequest.postData.text
      }
    } else if (contentType.includes('application/x-www-form-urlencoded') && harRequest.postData.params) {
      // Convert form params to object
      exampleValue = harRequest.postData.params.reduce(
        (acc, param) => {
          acc[param.name ?? ''] = param.value ?? ''
          return acc
        },
        {} as Record<string, string>,
      )
    }

    mediaTypeObject.examples[exampleKey] = {
      value: exampleValue,
    }
  }

  return operation
}

/**
 * Type guard to check if a parameter is a ParameterWithSchemaObject.
 * This is needed because ParameterObject is a union type.
 */
const isParameterWithSchema = (
  param: ParameterObject,
): param is ParameterObject & { examples?: Record<string, { value: unknown }> } => {
  return 'schema' in param || 'examples' in param || 'example' in param
}

/**
 * Finds an existing parameter in the parameters array or creates a new one.
 * This ensures we do not create duplicate parameters.
 */
const findOrCreateParameter = (
  parameters: ReferenceType<ParameterObject>[],
  name: string,
  inValue: 'query' | 'header' | 'path' | 'cookie',
): ParameterObject => {
  // Try to find existing parameter using getResolvedRef to handle references
  for (const param of parameters) {
    const resolved = getResolvedRef(param)
    if (resolved && resolved.name === name && resolved.in === inValue) {
      return resolved
    }
  }

  // Create new parameter with schema
  const newParam: ParameterObject = {
    name,
    in: inValue,
    schema: {
      type: 'string',
    },
  }

  parameters.push(newParam)
  return newParam
}
