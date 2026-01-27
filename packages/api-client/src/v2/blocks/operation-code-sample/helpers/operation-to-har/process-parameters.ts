import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { getExampleFromSchema } from '@v2/blocks/operation-code-sample/helpers/get-example-from-schema'
import type { Request as HarRequest } from 'har-format'

import { deSerializeParameter } from '@/v2/blocks/operation-block/helpers/de-serialize-parameter'
import { getExample } from '@/v2/blocks/operation-block/helpers/get-example'
import {
  serializeContentValue,
  serializeDeepObjectStyle,
  serializeFormStyle,
  serializeFormStyleForCookies,
  serializePipeDelimitedStyle,
  serializeSimpleStyle,
  serializeSpaceDelimitedStyle,
} from '@/v2/blocks/operation-block/helpers/serialize-parameter'
import { isParamDisabled } from '@/v2/blocks/request-block/helpers/is-param-disabled'

type ProcessedParameters = {
  url: string
  headers: HarRequest['headers']
  queryString: HarRequest['queryString']
  cookies: HarRequest['cookies']
}

/** Ensures we don't have any references in the parameters */
const deReferenceParams = (params: OperationObject['parameters']): ParameterObject[] =>
  (params ?? []).map((param) => getResolvedRef(param))

/**
 * Get the style and explode values for a parameter according to OpenAPI 3.1.1 specification.
 * Handles defaults and validation for parameter location restrictions.
 */
const getParameterStyleAndExplode = (param: ParameterObject): { style: string; explode: boolean } => {
  // Headers only support 'simple' style
  if (param.in === 'header') {
    const explode = 'explode' in param && param.explode !== undefined ? param.explode : false
    return { style: 'simple', explode }
  }

  // Cookies only support 'form' style
  if (param.in === 'cookie') {
    const explode = 'explode' in param && param.explode !== undefined ? param.explode : true
    return { style: 'form', explode }
  }

  const defaultStyle = {
    path: 'simple',
    query: 'form',
    header: 'simple',
    cookie: 'form',
  }[param.in]

  // Use provided style or default based on location
  const style = 'style' in param && param.style ? param.style : defaultStyle

  // Determine explode value: use provided value or default based on style
  const explode = 'explode' in param && param.explode !== undefined ? param.explode : style === 'form'

  return { style, explode }
}

/**
 * Extract the value for a parameter from example data or schema.
 * Prioritizes example data over schema examples.
 * Returns null if the parameter is disabled so we can skip it.
 */
const getParameterValue = (
  param: ParameterObject,
  example: string | undefined,
  contentType: string | undefined,
): unknown => {
  // Try to get value from example first
  const exampleValue = getExample(param, example, contentType)

  // If the parameter is disabled, return undefined so we can skip it.
  if (isParamDisabled(param, exampleValue)) {
    return undefined
  }

  // If the example value is set, return it.
  if (exampleValue?.value !== undefined) {
    return deSerializeParameter(exampleValue.value, param)
  }

  // Fall back to schema example if available
  if (!('schema' in param) || !param.schema) {
    return undefined
  }

  const options = param.in === 'path' ? { emptyString: `{${param.name}}` } : {}
  return getExampleFromSchema(getResolvedRef(param.schema), options)
}

/**
 * Process OpenAPI parameters and return the updated properties.
 * Handles path, query, and header parameters with various styles and explode options.
 *
 * @see https://spec.openapis.org/oas/latest.html#style-values
 */
export const processParameters = ({
  harRequest,
  parameters,
  example,
}: {
  harRequest: HarRequest
  parameters: OperationObject['parameters']
  /** The name of the example to use */
  example?: string | undefined
}): ProcessedParameters => {
  // Create copies of the arrays to avoid modifying the input
  const newHeaders = [...harRequest.headers]
  const newQueryString = [...harRequest.queryString]
  let newUrl = harRequest.url

  // Filter out references
  const deReferencedParams = deReferenceParams(parameters)

  for (const param of deReferencedParams) {
    if (!param.in || !param.name) {
      continue
    }

    const paramValue = getParameterValue(param, example, undefined)
    if (paramValue === undefined) {
      continue
    }

    const { style, explode } = getParameterStyleAndExplode(param)

    switch (param.in) {
      case 'path': {
        newUrl = processPathParameters(newUrl, param, paramValue, style, explode)
        break
      }

      case 'query': {
        // Content type parameters should be serialized according to the parameter's own content type
        if ('content' in param && param.content) {
          // We grab the first for now but eventually we should support selecting the content type per parameter
          const paramContentType = Object.keys(param.content)[0] ?? 'application/json'
          const serializedValue = serializeContentValue(paramValue, paramContentType)
          newQueryString.push({ name: param.name, value: serializedValue })
          break
        }

        // Handle query parameters
        switch (style) {
          case 'form': {
            const serialized = serializeFormStyle(paramValue, explode)

            // If serialized is an array of key-value pairs (exploded object or array)
            if (Array.isArray(serialized)) {
              for (const entry of serialized) {
                const key = entry.key || param.name
                newQueryString.push({ name: key, value: String(entry.value) })
              }
            }
            // Otherwise, convert to string
            else {
              newQueryString.push({ name: param.name, value: String(serialized) })
            }
            break
          }
          case 'spaceDelimited': {
            const serialized = serializeSpaceDelimitedStyle(paramValue)
            newQueryString.push({ name: param.name, value: serialized })
            break
          }
          case 'pipeDelimited': {
            const serialized = serializePipeDelimitedStyle(paramValue)
            newQueryString.push({ name: param.name, value: serialized })
            break
          }
          case 'deepObject': {
            if (explode) {
              const entries = serializeDeepObjectStyle(param.name, paramValue)
              for (const entry of entries) {
                newQueryString.push({ name: entry.key, value: entry.value })
              }
            }
            break
          }

          // Default to form style
          default:
            newQueryString.push({ name: param.name, value: String(paramValue) })
        }
        break
      }

      // Headers only support 'simple' style according to OpenAPI 3.1.1
      // For arrays, simple style always produces comma-separated values regardless of explode
      // The explode parameter only affects object serialization
      case 'header': {
        const serialized = serializeSimpleStyle(paramValue, explode)
        newHeaders.push({ name: param.name, value: String(serialized) })
        break
      }

      // Cookies only support 'form' style according to OpenAPI 3.1.1
      case 'cookie': {
        const serialized = serializeFormStyleForCookies(paramValue, explode)

        // If serialized is an array of key-value pairs (exploded object or array)
        if (Array.isArray(serialized)) {
          for (const entry of serialized) {
            const key = entry.key || param.name
            const value = entry.value === null ? 'null' : String(entry.value)
            harRequest.cookies.push({ name: key, value })
          }
        }
        // Otherwise, convert to string
        else {
          const value = serialized === null ? 'null' : String(serialized)
          harRequest.cookies.push({ name: param.name, value })
        }
        break
      }
    }
  }

  return {
    url: newUrl,
    headers: newHeaders,
    queryString: newQueryString,
    cookies: harRequest.cookies,
  }
}

/**
 * Process path parameters according to OpenAPI specification.
 * Handles matrix, label, and simple styles with explode options.
 *
 * @param url - The URL to process
 * @param param - The parameter object
 * @param paramValue - The value of the parameter
 * @param style - The style of the parameter (matrix, label, simple)
 * @param explode - Whether to explode the parameter
 * @returns The updated URL with processed path parameters
 */
const processPathParameters = (
  url: string,
  param: ParameterObject,
  paramValue: unknown,
  style: string,
  explode: boolean,
): string => {
  switch (style) {
    case 'matrix': {
      if (explode) {
        // Matrix explode array: ;color=blue;color=black;color=brown
        if (Array.isArray(paramValue)) {
          const values = (paramValue as unknown[]).map((v) => `${param.name}=${v}`).join(';')
          return url.replace(`{;${param.name}}`, `;${values}`)
        }

        // Matrix explode object: ;R=100;G=200;B=150
        if (typeof paramValue === 'object' && paramValue !== null) {
          const values = Object.entries(paramValue as Record<string, unknown>)
            .map(([k, v]) => `${k}=${v}`)
            .join(';')
          return url.replace(`{;${param.name}}`, `;${values}`)
        }

        // Matrix explode primitive: ;color=blue
        return url.replace(`{;${param.name}}`, `;${param.name}=${paramValue}`)
      }

      // Matrix no explode array: ;color=blue,black,brown
      if (Array.isArray(paramValue)) {
        return url.replace(`{;${param.name}}`, `;${param.name}=${(paramValue as unknown[]).join(',')}`)
      }

      // Matrix no explode object: ;color=R,100,G,200,B,150
      if (typeof paramValue === 'object' && paramValue !== null) {
        const values = Object.entries(paramValue as Record<string, unknown>)
          .map(([k, v]) => `${k},${v}`)
          .join(',')
        return url.replace(`{;${param.name}}`, `;${param.name}=${values}`)
      }

      // Matrix no explode primitive: ;color=blue
      return url.replace(`{;${param.name}}`, `;${param.name}=${paramValue}`)
    }
    case 'label': {
      if (explode) {
        // Label explode array: .blue.black.brown
        if (Array.isArray(paramValue)) {
          return url.replace(`{.${param.name}}`, `.${(paramValue as unknown[]).join('.')}`)
        }

        // Label explode object: .R=100.G=200.B=150
        if (typeof paramValue === 'object' && paramValue !== null) {
          const values = Object.entries(paramValue as Record<string, unknown>)
            .map(([k, v]) => `${k}=${v}`)
            .join('.')

          return url.replace(`{.${param.name}}`, `.${values}`)
        }

        // Label explode primitive: .blue
        return url.replace(`{.${param.name}}`, `.${paramValue}`)
      }

      // Label no explode array: .blue,black,brown
      if (Array.isArray(paramValue)) {
        return url.replace(`{.${param.name}}`, `.${(paramValue as unknown[]).join(',')}`)
      }

      // Label no explode object: .R,100,G,200,B,150
      if (typeof paramValue === 'object' && paramValue !== null) {
        const values = Object.entries(paramValue as Record<string, unknown>)
          .map(([k, v]) => `${k},${v}`)
          .join(',')

        return url.replace(`{.${param.name}}`, `.${values}`)
      }

      // Label no explode primitive: .blue
      return url.replace(`{.${param.name}}`, `.${paramValue}`)
    }

    case 'simple': {
      const serialized = serializeSimpleStyle(paramValue, explode)
      return url.replace(`{${param.name}}`, String(serialized))
    }

    // Default to simple style
    default:
      return url.replace(`{${param.name}}`, String(paramValue))
  }
}
