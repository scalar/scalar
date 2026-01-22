import { isDefined } from '@scalar/helpers/array/is-defined'
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
  serializeFormStyleForCookies,
  serializePipeDelimitedStyle,
  serializeSimpleStyle,
  serializeSpaceDelimitedStyle,
} from './serialize-parameter'

/** Helper to get explode value with default */
const getExplode = (param: ParameterObject, defaultValue: boolean): boolean =>
  'explode' in param && param.explode !== undefined ? param.explode : defaultValue

/**
 * Converts the parameters into a set of headers, cookies and url params while
 * replacing environment variables and extracting example values. Also builds up a record of the path
 * parameters which can then be used to replace variables in the path.
 * Also handles both content based and schema based parameters.
 *
 * @param parameters - Unfiltered parameters
 * @param env - Environment variables flattened into a key-value object
 * @param exampleKey - The key of the current example
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
  const result = {
    cookies: [] as XScalarCookie[],
    headers: {} as Record<string, string>,
    pathVariables: {} as Record<string, string>,
    urlParams: new URLSearchParams(),
  }

  // Early return for empty parameters
  if (parameters.length === 0) {
    return result
  }

  const deReferencedParameters: ParameterObject[] = []
  let contentType = 'application/json'

  // First pass: dereference and extract content type
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

  // Second pass: process all parameters
  for (const param of deReferencedParameters) {
    const example = getExample(param, exampleKey, contentType)

    // Skip disabled examples
    if (!example || isParamDisabled(param, example)) {
      continue
    }

    /** Replace environment variables in the key and value */
    const replacedValue = typeof example.value === 'string' ? replaceEnvVariables(example.value, env) : example.value
    const paramName = replaceEnvVariables(param.name, env)

    // Handle by parameter location
    switch (param.in) {
      case 'header': {
        // Filter out Content-Type header when it is multipart/form-data
        // The browser will automatically set this header with the proper boundary
        const lowerParamName = paramName.toLowerCase()
        if (lowerParamName === 'content-type' && replacedValue === 'multipart/form-data') {
          break
        }

        /** Headers only support simple style according to OpenAPI 3.1.1 */
        const serialized = serializeSimpleStyle(replacedValue, getExplode(param, false))

        // Remove undefined/null headers
        if (!isDefined(serialized)) {
          break
        }

        /** Headers can only be strings so we can cast numbers etc */
        const serializedString = String(serialized)

        // If the header already exists, append with comma
        if (result.headers[paramName]) {
          result.headers[paramName] = `${result.headers[paramName]},${serializedString}`
        } else {
          result.headers[paramName] = serializedString
        }
        break
      }

      case 'path': {
        // Path parameters use simple style by default
        const serialized = serializeSimpleStyle(replacedValue, getExplode(param, false))
        result.pathVariables[paramName] = encodeURIComponent(String(serialized))
        break
      }

      case 'query': {
        processQueryParameter(param, paramName, replacedValue, contentType, result.urlParams)
        break
      }

      case 'cookie': {
        processCookieParameter(paramName, replacedValue, getExplode(param, true), result.cookies)
        break
      }
    }
  }

  return result
}

/**
 * Helper function to process query parameters.
 * Extracted to reduce complexity in main function.
 */
const processQueryParameter = (
  param: ParameterObject,
  paramName: string,
  replacedValue: unknown,
  contentType: string,
  urlParams: URLSearchParams,
): void => {
  /** If the parameter should be exploded, defaults to true for form style */
  const explodeParam = 'explode' in param && param.explode !== undefined ? param.explode : true

  /** Style of the parameter, defaults to form */
  const style = 'style' in param && param.style ? param.style : 'form'

  // Content type parameters should be serialized according to the content type
  if ('content' in param && param.content) {
    const serializedValue = serializeContentValue(replacedValue, contentType)
    urlParams.set(paramName, serializedValue)
    return
  }

  // Handle deepObject style
  if (style === 'deepObject' && explodeParam) {
    const entries = serializeDeepObjectStyle(paramName, replacedValue)
    for (const entry of entries) {
      urlParams.append(entry.key, entry.value)
    }
    return
  }

  // Handle spaceDelimited style
  if (style === 'spaceDelimited') {
    const serialized = serializeSpaceDelimitedStyle(replacedValue)
    const existingValue = urlParams.get(paramName)
    urlParams.set(paramName, existingValue ? `${existingValue} ${serialized}` : serialized)
    return
  }

  // Handle pipeDelimited style
  if (style === 'pipeDelimited') {
    const serialized = serializePipeDelimitedStyle(replacedValue)
    const existingValue = urlParams.get(paramName)
    urlParams.set(paramName, existingValue ? `${existingValue}|${serialized}` : serialized)
    return
  }

  // Handle form style (default)
  const serialized = serializeFormStyle(replacedValue, explodeParam)

  // If serialized is an array of key-value pairs (exploded object or array)
  if (Array.isArray(serialized)) {
    for (const entry of serialized) {
      // If key is empty, use paramName (for arrays)
      const key = entry.key || paramName
      urlParams.append(key, String(entry.value))
    }
  } else {
    // Otherwise, convert to string for URLSearchParams
    urlParams.append(paramName, String(serialized))
  }
}

/**
 * Helper function to process cookie parameters.
 * Extracted to reduce complexity in main function.
 */
const processCookieParameter = (
  paramName: string,
  replacedValue: unknown,
  explode: boolean,
  cookies: XScalarCookie[],
): void => {
  // Cookies only support form style according to OpenAPI 3.1.1
  const serialized = serializeFormStyleForCookies(replacedValue, explode)

  // If serialized is an array of key-value pairs (exploded object or array)
  if (Array.isArray(serialized)) {
    for (const entry of serialized) {
      const key = entry.key || paramName
      cookies.push(
        coerceValue(xScalarCookieSchema, {
          name: key,
          value: String(entry.value),
          path: '/',
        }),
      )
    }
  } else {
    // Otherwise, convert to string for cookie value
    cookies.push(
      coerceValue(xScalarCookieSchema, {
        name: paramName,
        value: String(serialized),
        path: '/',
      }),
    )
  }
}
