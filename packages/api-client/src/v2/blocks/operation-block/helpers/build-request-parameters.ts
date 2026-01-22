import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  type XScalarCookie,
  xScalarCookieSchema,
} from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { ParameterObject, ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isParamDisabled } from '@/v2/blocks/request-block/helpers/is-param-disabled'

import { getExample } from './get-example'
import {
  serializeContentValue,
  serializeDeepObjectStyle,
  serializeFormStyle,
  serializePipeDelimitedStyle,
  serializeSimpleStyle,
  serializeSpaceDelimitedStyle,
} from './serialize-parameter'

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
  headers: Record<string, unknown>
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

        // Headers only support simple style according to OpenAPI 3.1.1
        const explode = 'explode' in param && param.explode !== undefined ? param.explode : false
        const serialized = serializeSimpleStyle(replacedValue, explode)

        // If the header already exists, append with comma (convert to string for concatenation)
        if (acc.headers[paramName]) {
          acc.headers[paramName] = `${acc.headers[paramName]},${serialized}`
        } else {
          acc.headers[paramName] = serialized
        }
      }

      // Handle path parameters
      if (param.in === 'path') {
        // Path parameters use simple style by default
        const explode = 'explode' in param && param.explode !== undefined ? param.explode : false
        const serialized = serializeSimpleStyle(replacedValue, explode)
        acc.pathVariables[paramName] = encodeURIComponent(String(serialized))
      }

      // Handle query parameters
      if (param.in === 'query') {
        /** If the parameter should be exploded, defaults to true for form style */
        const explodeParam = 'explode' in param && param.explode !== undefined ? param.explode : true

        /** Style of the parameter, defaults to form */
        const style = 'style' in param && param.style ? param.style : 'form'

        // Content type parameters should be serialized according to the content type
        if ('content' in param && param.content) {
          const serializedValue = serializeContentValue(replacedValue, contentType)
          acc.urlParams.set(paramName, serializedValue)
        }
        // Handle deepObject style
        else if (style === 'deepObject' && explodeParam) {
          const entries = serializeDeepObjectStyle(paramName, replacedValue)
          for (const entry of entries) {
            acc.urlParams.append(entry.key, entry.value)
          }
        }
        // Handle spaceDelimited style
        else if (style === 'spaceDelimited') {
          const serialized = serializeSpaceDelimitedStyle(replacedValue)
          const existingValue = acc.urlParams.get(paramName)
          if (existingValue) {
            acc.urlParams.set(paramName, `${existingValue} ${serialized}`)
          } else {
            acc.urlParams.set(paramName, serialized)
          }
        }
        // Handle pipeDelimited style
        else if (style === 'pipeDelimited') {
          const serialized = serializePipeDelimitedStyle(replacedValue)
          const existingValue = acc.urlParams.get(paramName)
          if (existingValue) {
            acc.urlParams.set(paramName, `${existingValue}|${serialized}`)
          } else {
            acc.urlParams.set(paramName, serialized)
          }
        }
        // Handle form style (default)
        else {
          // When explode is not explicitly set and the value is an array or object,
          // treat it as explode: false to serialize as a single value
          const explode =
            explodeParam &&
            !('explode' in param) &&
            (Array.isArray(replacedValue) || (typeof replacedValue === 'object' && replacedValue !== null))
              ? false
              : explodeParam

          const serialized = serializeFormStyle(replacedValue, explode)

          // If serialized is an array of key-value pairs (exploded object or array)
          if (Array.isArray(serialized)) {
            for (const entry of serialized) {
              // If key is empty, use paramName (for arrays)
              const key = entry.key || paramName
              acc.urlParams.append(key, String(entry.value))
            }
          }
          // Otherwise, convert to string for URLSearchParams
          else {
            acc.urlParams.append(paramName, String(serialized))
          }
        }
      }

      // Handle cookies
      if (param.in === 'cookie') {
        // Cookies only support form style according to OpenAPI 3.1.1
        const explode = 'explode' in param && param.explode !== undefined ? param.explode : true
        const serialized = serializeFormStyle(replacedValue, explode)

        // If serialized is an array of key-value pairs (exploded object or array)
        if (Array.isArray(serialized)) {
          for (const entry of serialized) {
            const key = entry.key || paramName
            acc.cookies.push(
              coerceValue(xScalarCookieSchema, {
                name: key,
                value: String(entry.value),
                path: '/',
              }),
            )
          }
        }
        // Otherwise, convert to string for cookie value
        else {
          acc.cookies.push(
            coerceValue(xScalarCookieSchema, {
              name: paramName,
              value: String(serialized),
              path: '/',
            }),
          )
        }
      }

      return acc
    },
    {
      cookies: [] as XScalarCookie[],
      headers: {} as Record<string, unknown>,
      pathVariables: {} as Record<string, string>,
      urlParams: new URLSearchParams(),
    },
  )
}
