import { isDefined } from '@scalar/helpers/array/is-defined'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  type XScalarCookie,
  xScalarCookieSchema,
} from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { ParameterObject, ReferenceType } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { deSerializeParameter } from '@/request-example/builder/header/de-serialize-parameter'

import { getExample } from '../helpers/get-example'
import { isParamDisabled } from './is-param-disabled'
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
 * @param exampleName - The key of the current example
 * @returns A set of headers, cookies and url params
 */
export const buildRequestParameters = (
  /** All parameters */
  parameters: ReferenceType<ParameterObject>[] = [],
  /** The key of the current example */
  exampleName: string = 'default',
): {
  cookies: XScalarCookie[]
  headers: Record<string, string>
  pathVariables: Record<string, string>
  allowReservedQueryParameters: Set<string>
  urlParams: URLSearchParams
} => {
  const result = {
    cookies: [] as XScalarCookie[],
    headers: {} as Record<string, string>,
    pathVariables: {} as Record<string, string>,
    allowReservedQueryParameters: new Set<string>(),
    urlParams: new URLSearchParams(),
  }

  // Early return for empty parameters
  if (parameters.length === 0) {
    return result
  }

  // Second pass: process all parameters
  for (const referencedParam of parameters) {
    const param = getResolvedRef(referencedParam)
    const example = getExample(param, exampleName, undefined)

    // Skip disabled examples
    if (!example || isParamDisabled(param, example)) {
      continue
    }

    /** Replace environment variables in the key and value */
    const value = example.value

    /** De-serialize the example value if it is a string and matches the schema type */
    const deSerializedValue = deSerializeParameter(value, param)
    const paramName = param.name

    // Handle by parameter location
    switch (param.in) {
      case 'header': {
        // Filter out Content-Type header when it is multipart/form-data
        // The browser will automatically set this header with the proper boundary
        const lowerParamName = paramName.toLowerCase()
        if (lowerParamName === 'content-type' && deSerializedValue === 'multipart/form-data') {
          break
        }

        /** Headers only support simple style according to OpenAPI 3.1.1 */
        const serialized = serializeSimpleStyle(deSerializedValue, getExplode(param, false))

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
        const serialized = serializeSimpleStyle(deSerializedValue, getExplode(param, false))
        result.pathVariables[paramName] = encodeURIComponent(String(serialized))
        break
      }

      case 'query': {
        processQueryParameter(
          param,
          paramName,
          deSerializedValue,
          result.urlParams,
          result.allowReservedQueryParameters,
        )
        break
      }

      case 'cookie': {
        processCookieParameter(paramName, deSerializedValue, getExplode(param, true), result.cookies)
        break
      }
    }
  }

  return result
}

/** Ensure we only apply the correcet style to the correct types */
const getStyle = (param: ParameterObject, replacedValue: unknown): string => {
  if (!('style' in param) || !param.style) {
    return 'form'
  }

  // DeepObject can only apply to objects
  if (param.style === 'deepObject') {
    if (isObject(replacedValue)) {
      return 'deepObject'
    }
    return 'form'
  }

  return param.style
}

/** Whether the parameter allows reserved characters (from param or schema). */
const isAllowReserved = (param: ParameterObject): boolean => {
  if ('allowReserved' in param && param.allowReserved !== undefined) {
    return param.allowReserved
  }
  if ('schema' in param && param.schema && typeof param.schema === 'object' && 'allowReserved' in param.schema) {
    return (param.schema as { allowReserved?: boolean }).allowReserved === true
  }
  return false
}

/** When allowReserved is true, add keys to the set so reserved chars stay unescaped in the URL. */
const trackReservedKeys = (
  allowReservedQueryParameters: Set<string>,
  allowReserved: boolean,
  ...keys: string[]
): void => {
  if (allowReserved) {
    for (const key of keys) {
      allowReservedQueryParameters.add(key)
    }
  }
}

/**
 * Helper function to process query parameters.
 * Extracted to reduce complexity in main function.
 */
const processQueryParameter = (
  param: ParameterObject,
  paramName: string,
  replacedValue: unknown,
  urlParams: URLSearchParams,
  allowReservedQueryParameters: Set<string>,
): void => {
  /** If the parameter should be exploded, defaults to true for form style */
  const explodeParam = 'explode' in param && param.explode !== undefined ? param.explode : true
  /** Whether the parameter allows reserved characters (from param or schema). */
  const allowReserved = isAllowReserved(param)

  /** Style of the parameter, defaults to form */
  const style = getStyle(param, replacedValue)

  // Content type parameters should be serialized according to the parameter's own content type
  if ('content' in param && param.content) {
    // We grab the first for now but eventually we should support selecting the content type per parameter
    const paramContentType = Object.keys(param.content)[0] ?? 'application/json'
    const serializedValue = serializeContentValue(replacedValue, paramContentType)
    urlParams.set(paramName, serializedValue)
    trackReservedKeys(allowReservedQueryParameters, allowReserved, paramName)
    return
  }

  // Handle deepObject style
  if (style === 'deepObject' && explodeParam) {
    const entries = serializeDeepObjectStyle(paramName, replacedValue)
    for (const entry of entries) {
      urlParams.append(entry.key, entry.value)
      trackReservedKeys(allowReservedQueryParameters, allowReserved, paramName)
    }
    return
  }

  // Handle spaceDelimited style
  if (style === 'spaceDelimited') {
    const serialized = serializeSpaceDelimitedStyle(replacedValue)
    const existingValue = urlParams.get(paramName)
    urlParams.set(paramName, existingValue ? `${existingValue} ${serialized}` : serialized)
    trackReservedKeys(allowReservedQueryParameters, allowReserved, paramName)
    return
  }

  // Handle pipeDelimited style
  if (style === 'pipeDelimited') {
    const serialized = serializePipeDelimitedStyle(replacedValue)
    const existingValue = urlParams.get(paramName)
    urlParams.set(paramName, existingValue ? `${existingValue}|${serialized}` : serialized)
    trackReservedKeys(allowReservedQueryParameters, allowReserved, paramName)
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
      trackReservedKeys(allowReservedQueryParameters, allowReserved, paramName)
    }
  } else {
    // Otherwise, convert to string for URLSearchParams
    urlParams.append(paramName, String(serialized))
    trackReservedKeys(allowReservedQueryParameters, allowReserved, paramName)
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
