import type { ContentType, TransformedOperation } from '@scalar/types/legacy'

import { json2xml } from '../helpers/json2xml'
import { normalizeMimeTypeObject } from '../helpers/normalizeMimeTypeObject'
import { prettyPrintJson } from '../helpers/prettyPrintJson'
import { getExampleFromSchema } from './getExampleFromSchema'
import { getParametersFromOperation } from './getParametersFromOperation'

type AnyObject = Record<string, any>

/**
 * Transform the object into a nested array of objects
 * that represent the key-value pairs of the object.
 */
function getParamsFromObject(
  obj: AnyObject,
  prefix = '',
): {
  name: string
  value: any
}[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const newKey = prefix ? `${prefix}[${key}]` : key

    if (typeof value === 'object' && value !== null) {
      return getParamsFromObject(value, newKey)
    }

    return [{ name: newKey, value }]
  })
}
// Define all supported mime types
const mimeTypes = [
  'application/json',
  'application/octet-stream',
  'application/x-www-form-urlencoded',
  'application/xml',
  'multipart/form-data',
  'text/plain',
] as const

/**
 * Get the request body from the operation.
 */
export function getRequestBodyFromOperation(
  operation: Omit<TransformedOperation, 'httpVerb'>,
  selectedExampleKey?: string | number,
  omitEmptyAndOptionalProperties?: boolean,
): {
  mimeType: (typeof mimeTypes)[number]
  text?: string
  params?: {
    name: string
    value?: string
  }[]
} | null {
  // Get the content object from the operation
  const originalContent = operation.information?.requestBody?.content
  const content = normalizeMimeTypeObject(originalContent)

  /**
   *  Find the first mime type that is supported
   *
   * TODO: This is very fragile. There needs to be significantly more support for
   * vendor specific content types (like application/vnd.github+json)
   */
  const mimeType = mimeTypes.find((currentMimeType: ContentType) => !!content?.[currentMimeType]) ?? 'application/json'

  /** Examples */
  const examples = content?.[mimeType]?.examples ?? content?.['application/json']?.examples

  // Let’s use the first example
  const selectedExample = (examples ?? {})?.[selectedExampleKey ?? Object.keys(examples ?? {})[0]]

  if (selectedExample) {
    return {
      mimeType,
      text: prettyPrintJson(selectedExample?.value),
    }
  }

  /**
   * Body Parameters (Swagger 2.0)
   *
   * ”The payload that's appended to the HTTP request. Since there can only be one payload, there can only
   * be one body parameter. The name of the body parameter has no effect on the parameter itself and is used
   * for documentation purposes only. Since Form parameters are also in the payload, body and form
   * parameters cannot exist together for the same operation.”
   */
  const bodyParameters = getParametersFromOperation(operation, 'body', false)

  if (bodyParameters.length > 0) {
    return {
      mimeType: 'application/json',
      text: prettyPrintJson(bodyParameters[0].value),
    }
  }

  /**
   * FormData Parameters (Swagger 2.0)
   *
   * “Form - Used to describe the payload of an HTTP request when either application/x-www-form-urlencoded,
   * multipart/form-data or both are used as the content type of the request (in Swagger's definition, the
   * consumes property of an operation). This is the only parameter type that can be used to send files,
   * thus supporting the file type. Since form parameters are sent in the payload, they cannot be declared
   * together with a body parameter for the same operation. Form parameters have a different format based on
   * the content-type used (for further details, consult http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4):
   * - application/x-www-form-urlencoded - Similar to the format of Query parameters but as a payload.
   *   For example, foo=1&bar=swagger - both foo and bar are form parameters. This is normally used for simple
   *   parameters that are being transferred.
   * - multipart/form-data - each parameter takes a section in the payload with an internal header.
   *   For example, for the header Content-Disposition: form-data; name="submit-name" the name of the parameter is
   *   submit-name. This type of form parameters is more commonly used for file transfers.”
   */

  const formDataParameters = getParametersFromOperation(operation, 'formData', false)

  if (formDataParameters.length > 0) {
    return {
      mimeType: 'application/x-www-form-urlencoded',
      params: formDataParameters.map((parameter) => ({
        name: parameter.name,
        /**
         * TODO: This value MUST be a string
         * Figure out why this is not always a string
         *
         * JSON.stringify is a TEMPORARY fix
         */
        value: typeof parameter.value === 'string' ? parameter.value : JSON.stringify(parameter.value),
      })),
    }
  }

  // If no mime type is supported, exit early
  if (!mimeType) {
    return null
  }

  // Get the request body object for the mime type
  const requestBodyObject = content?.[mimeType]

  // Get example from operation
  const example = requestBodyObject?.example ? requestBodyObject?.example : undefined

  // JSON
  if (mimeType === 'application/json') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema, {
          mode: 'write',
          omitEmptyAndOptionalProperties: omitEmptyAndOptionalProperties,
        })
      : null

    const body = example ?? exampleFromSchema

    return {
      mimeType,
      text: body ? typeof body === 'string' ? body : JSON.stringify(body, null, 2) : undefined,
    }
  }

  // XML
  if (mimeType === 'application/xml') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema, {
          xml: true,
          mode: 'write',
        })
      : null

    return {
      mimeType,
      text: example ?? json2xml(exampleFromSchema, '  '),
    }
  }

  // Binary data
  if (mimeType === 'application/octet-stream') {
    return {
      mimeType,
      text: 'BINARY',
    }
  }

  // Plain text
  if (mimeType === 'text/plain') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema, {
          xml: true,
          mode: 'write',
        })
      : null

    return {
      mimeType,
      text: example ?? exampleFromSchema ?? '',
    }
  }

  // URL encoded data
  if (mimeType === 'multipart/form-data' || mimeType === 'application/x-www-form-urlencoded') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema, {
          xml: true,
          mode: 'write',
        })
      : null

    return {
      mimeType,
      params: getParamsFromObject(example ?? exampleFromSchema ?? {}),
    }
  }

  return null
}
