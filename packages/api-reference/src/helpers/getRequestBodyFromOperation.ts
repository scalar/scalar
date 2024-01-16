import { mergeAllObjects } from '../helpers'
import type { ContentType, TransformedOperation } from '../types'
import {
  getExampleFromSchema,
  getParametersFromOperation,
  json2xml,
  prettyPrintJson,
} from './'

/**
 * Get the request body from the operation.
 */
export function getRequestBodyFromOperation(operation: TransformedOperation) {
  // Define all supported mime types
  const mimeTypes: ContentType[] = [
    'application/json',
    'application/octet-stream',
    'application/x-www-form-urlencoded',
    'application/xml',
    'multipart/form-data',
    'text/plain',
  ]

  // Find the first mime type that is supported
  const mimeType: ContentType | undefined = mimeTypes.find(
    (currentMimeType: ContentType) =>
      !!operation.information?.requestBody?.content?.[currentMimeType],
  )

  // TODO:
  // * Add support for formData
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
      postData: {
        mimeType: 'application/json',
        text: prettyPrintJson(bodyParameters[0]),
      },
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

  // If no mime type is supported, exit early
  if (!mimeType) {
    return null
  }

  // Get the request body object for the mime type
  const requestBodyObject =
    operation.information?.requestBody?.content?.[mimeType]

  // Define the appropriate Content-Type headers
  const headers = [
    {
      name: 'Content-Type',
      value: mimeType,
    },
  ]

  // Get example from operation
  const example = requestBodyObject?.example
    ? requestBodyObject?.example
    : undefined

  // JSON
  if (mimeType === 'application/json') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema)
      : null

    return {
      headers,
      postData: {
        mimeType: mimeType,
        text: example ?? JSON.stringify(exampleFromSchema, null, 2),
      },
    }
  }

  // XML
  if (mimeType === 'application/xml') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema, {
          xml: true,
        })
      : null

    return {
      headers,
      postData: {
        mimeType: mimeType,
        text: example ?? json2xml(exampleFromSchema, '  '),
      },
    }
  }

  // Binary data
  if (mimeType === 'application/octet-stream') {
    return {
      headers,
      postData: {
        mimeType: mimeType,
        text: 'BINARY',
      },
    }
  }

  // Plain text
  if (mimeType === 'text/plain') {
    const exampleFromSchema = requestBodyObject?.schema
      ? getExampleFromSchema(requestBodyObject?.schema, {
          xml: true,
        })
      : null

    return {
      headers,
      postData: {
        mimeType: mimeType,
        text: example ?? exampleFromSchema ?? '',
      },
    }
  }

  // URL encoded data
  if (mimeType === 'application/x-www-form-urlencoded') {
    return {
      headers,
      postData: {
        mimeType: mimeType,
        // TODO: We have an object, but how do we get that kind of array from the object?
        // Don’t forget to include nested properties … :|
        // params: [
        //   {
        //     name: 'foo',
        //     value: 'bar',
        //   },
        // ],
      },
    }
  }

  // URL encoded data
  if (mimeType === 'multipart/form-data') {
    return {
      headers,
      postData: {
        mimeType: mimeType,
        // TODO: We have an object, but how do we get that kind of array from the object?
        // Don’t forget to include nested properties … :|
        // params: [
        //   {
        //     name: 'foo',
        //     value: 'bar',
        //   },
        // ],
      },
    }
  }

  return undefined
}
