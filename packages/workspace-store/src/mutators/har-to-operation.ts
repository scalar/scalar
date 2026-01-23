import type { HarRequest } from '@scalar/snippetz'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/reference'

import { isContentTypeParameterObject } from '@/schemas/v3.1/strict/type-guards'

type HarToOperationProps = {
  /** HAR request to convert */
  harRequest: HarRequest
  /** Name of the example to populate (e.g., 'default', 'example1') */
  exampleKey: string
  /** Optional base operation to merge with */
  baseOperation?: OperationObject
  /** Optional path variables to merge with */
  pathVariables?: Record<string, string>
}

const preprocessParameters = (
  parameters: ReferenceType<ParameterObject>[],
  pathVariables: Record<string, string>,
  exampleKey: string,
) => {
  parameters.forEach((param) => {
    const resolvedParam = getResolvedRef(param)
    if (isContentTypeParameterObject(resolvedParam)) {
      return
    }

    setParameterDisabled(getResolvedRef(param), exampleKey, true)

    if (resolvedParam.in === 'path') {
      resolvedParam.examples ||= {}
      resolvedParam.examples[exampleKey] = {
        value: pathVariables[resolvedParam.name] ?? '',
        'x-disabled': false,
      }
    }
  })
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
  pathVariables = {},
}: HarToOperationProps): OperationObject => {
  // Ensure parameters array exists on the base operation
  if (!baseOperation.parameters) {
    baseOperation.parameters = []
  }

  // Set any other parameters as disabled and set the path variables
  preprocessParameters(baseOperation.parameters, pathVariables, exampleKey)

  // Process query string parameters from the HAR request
  if (harRequest.queryString && harRequest.queryString.length > 0) {
    for (const queryParam of harRequest.queryString) {
      const param = findOrCreateParameter(baseOperation.parameters, queryParam.name, 'query')

      if (!param || isContentTypeParameterObject(param)) {
        continue
      }

      param.examples ||= {}
      param.examples[exampleKey] = {
        value: queryParam.value,
        'x-disabled': false,
      }
    }
  }

  // Process headers from the HAR request
  if (harRequest.headers && harRequest.headers.length > 0) {
    for (const header of harRequest.headers) {
      const param = findOrCreateParameter(baseOperation.parameters, header.name, 'header')

      if (!param || isContentTypeParameterObject(param)) {
        continue
      }

      param.examples ||= {}
      param.examples[exampleKey] = {
        value: header.value,
        'x-disabled': false,
      }
    }
  }

  // Process cookies from the HAR request
  if (harRequest.cookies && harRequest.cookies.length > 0) {
    for (const cookie of harRequest.cookies) {
      const param = findOrCreateParameter(baseOperation.parameters, cookie.name, 'cookie')

      if (!param || isContentTypeParameterObject(param)) {
        continue
      }

      param.examples ||= {}
      param.examples[exampleKey] = {
        value: cookie.value,
        'x-disabled': false,
      }
    }
  }

  // Process request body from the HAR request
  if (harRequest.postData) {
    const { mimeType, text, params } = harRequest.postData

    // Ensure requestBody exists on the base operation
    if (!baseOperation.requestBody) {
      baseOperation.requestBody = {
        content: {},
      }
    }

    // Resolve the request body in case it is a reference
    const requestBody = getResolvedRef(baseOperation.requestBody)

    // Ensure the content type exists in the requestBody
    if (!requestBody.content[mimeType]) {
      requestBody.content[mimeType] = {
        schema: {
          type: 'object',
        },
      }
    }

    // Get the media type object
    const mediaType = requestBody.content[mimeType]
    if (!mediaType) {
      return baseOperation
    }

    // Ensure examples object exists
    mediaType.examples ||= {}

    // Convert the HAR postData to an example value
    let exampleValue: any

    // If params exist (form data), convert to array
    if (params && params.length > 0) {
      exampleValue = []
      for (const param of params) {
        exampleValue.push({
          name: param.name,
          value: param.value,
          'x-disabled': false,
        })
      }
    } else {
      exampleValue = text
    }

    // Add the example to the media type
    mediaType.examples[exampleKey] = {
      value: exampleValue,
      'x-disabled': false,
    }

    // Update the selected media type
    requestBody['x-scalar-selected-content-type'] ||= {}
    requestBody['x-scalar-selected-content-type'][exampleKey] = mimeType
  }

  return baseOperation
}

const setParameterDisabled = (param: ParameterObject, exampleKey: string, disabled: boolean): void => {
  if (isContentTypeParameterObject(param)) {
    return
  }

  if (!param.examples?.[exampleKey]) {
    return
  }

  getResolvedRef(param.examples[exampleKey])['x-disabled'] = disabled
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
    if (isContentTypeParameterObject(resolved)) {
      continue
    }

    // Check if parameter location matches
    if (resolved.in !== inValue) {
      continue
    }

    // For headers, use case-insensitive comparison; otherwise use exact match
    const namesMatch =
      inValue === 'header' ? resolved.name.toLowerCase() === name.toLowerCase() : resolved.name === name

    if (namesMatch) {
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
