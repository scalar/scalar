import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  type XScalarCookie,
  xScalarCookieSchema,
} from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { ParameterObject, ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isParamDisabled } from '@/v2/blocks/request-block/helpers/is-param-disabled'

import { getDelimiter } from './get-delimiter'
import { getExample } from './get-example'

/**
 * Serializes a value based on the content type for content-based query parameters.
 * Content-based query parameters do not use style serialization and instead follow
 * their content type specification (e.g., application/json should be JSON.stringified).
 *
 * @param value - The value to serialize
 * @param contentType - The content type to use for serialization
 * @returns The serialized value as a string
 */
const serializeContentValue = (value: unknown, contentType: string): string => {
  // If already a string, return as is
  if (typeof value === 'string') {
    return value
  }

  // Handle JSON content types
  if (contentType.includes('json')) {
    return JSON.stringify(value)
  }

  // Default: convert to string
  return String(value)
}

/**
 * Converts the parameters into a set of headers, cookies and url params while
 * replacing environment variables and extracting example values. Also builds up a record of the path
 * parameters which can then be used to replace variables in the path.
 * Also handles both content based and schema based parameters.
 *
 * @param parameters - Unfiltered parameters
 * @param env - Environment variables flattened into a key-value object
 * @param exampleKey - The key of the current example
 * @param contentType - Content type for content based parameters
 * @returns A set of headers, cookies and url params
 */
export const buildRequestParameters = (
  /** All parameters */
  parameters: ReferenceType<ParameterObject>[] = [],
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
  /** The key of the current example */
  exampleKey: string = 'default',
): {
  cookies: XScalarCookie[]
  headers: Record<string, string>
  pathVariables: Record<string, string>
  urlParams: URLSearchParams
} => {
  const deReferencedParameters = [] as ParameterObject[]
  let contentType = 'application/json'

  // We gotta grab the content type first so we de-reference while were at it
  for (const param of parameters) {
    const deReferencedParam = getResolvedRef(param)
    deReferencedParameters.push(deReferencedParam)

    // Grab the content type from the headers
    if (
      deReferencedParam.in === 'header' &&
      deReferencedParam.name.toLowerCase() === 'content-type' &&
      'examples' in deReferencedParam
    ) {
      contentType = getResolvedRef(deReferencedParam?.examples?.[exampleKey])?.value ?? contentType
    }
  }

  // Loop over all parameters and build up our request segments
  return deReferencedParameters.reduce(
    (acc, param) => {
      const example = getExample(param, exampleKey, contentType)

      // Skip disabled examples
      if (!example || isParamDisabled(param, example)) {
        return acc
      }

      /** Replace environment variables in the key and value */
      const replacedValue = typeof example.value === 'string' ? replaceEnvVariables(example.value, env) : example.value
      const paramName = replaceEnvVariables(param.name, env)

      // Handle headers
      if (param.in === 'header') {
        // Filter out Content-Type header when it is multipart/form-data
        // The browser will automatically set this header with the proper boundary
        if (paramName.toLowerCase() === 'content-type' && replacedValue === 'multipart/form-data') {
          return acc
        }

        // headers only support simple style which means we separate the value by commas for multiple values
        if (acc.headers[paramName]) {
          acc.headers[paramName] += `,${replacedValue}`
        } else {
          acc.headers[paramName] = replacedValue
        }
      }

      // Handle path parameters
      if (param.in === 'path') {
        acc.pathVariables[paramName] = encodeURIComponent(replacedValue)
      }

      // Handle query parameters (currently array only)
      if (param.in === 'query') {
        /** If the parameter should be exploded, defaults to true*/
        const explode = 'explode' in param && param.explode !== undefined ? param.explode : true

        /** Style of the parameter, defaults to form */
        const style = 'style' in param && param.style ? param.style : 'form'

        // Content type parameters should be serialized according to the content type
        if ('content' in param && param.content) {
          const serializedValue = serializeContentValue(replacedValue, contentType)
          acc.urlParams.set(paramName, serializedValue)
        }

        // explode=true only supported on form style
        else if (explode) {
          acc.urlParams.append(paramName, replacedValue)
        }

        // handle the rest of the array styles
        else {
          const existingValue = acc.urlParams.get(paramName)

          // If the parameter already has a value, append the new value with the delimiter
          if (existingValue) {
            const delimiter = getDelimiter(style)
            acc.urlParams.set(paramName, `${existingValue}${delimiter}${replacedValue}`)
          } else {
            acc.urlParams.set(paramName, replacedValue)
          }
        }
      }

      // Handle cookies
      if (param.in === 'cookie') {
        acc.cookies.push(
          coerceValue(xScalarCookieSchema, {
            name: paramName,
            value: replacedValue,
            path: '/',
          }),
        )
      }

      return acc
    },
    {
      cookies: [] as XScalarCookie[],
      headers: {} as Record<string, string>,
      pathVariables: {} as Record<string, string>,
      urlParams: new URLSearchParams(),
    },
  )
}
