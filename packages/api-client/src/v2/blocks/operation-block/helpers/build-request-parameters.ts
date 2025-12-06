import { replaceEnvVariables, replaceVariables } from '@scalar/helpers/regex/replace-variables'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import {
  type XScalarCookie,
  xScalarCookieSchema,
} from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Grabs the example from both schema based and content based parameters */
const getExample = (param: ParameterObject, exampleKey: string, contentType: string) => {
  if ('content' in param) {
    return getResolvedRef(param.content?.[contentType]?.examples?.[exampleKey])
  }
  if ('examples' in param) {
    return getResolvedRef(param.examples?.[exampleKey])
  }
  return undefined
}

/**
 * Gets the delimiter for the given parameter style
 *
 * @param style - The style of the parameter
 * @returns The delimiter for the given style
 */
const getDelimiter = (style: string): string => {
  switch (style) {
    // color=blue black brown
    case 'spaceDelimited':
      return ' '
    // color=blue|black|brown
    case 'pipeDelimited':
      return '|'
    // color=blue,black,brown
    case 'form':
    default:
      return ','
  }
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
  parameters: ParameterObject[] = [],
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
  /** The key of the current example */
  exampleKey: string = 'default',
  /**
   * Content type for content based parameters
   *
   * @see https://spec.openapis.org/oas/latest.html#fixed-fields-for-use-with-content
   */
  contentType: string = 'application/json',
): {
  cookies: XScalarCookie[]
  headers: Record<string, string>
  pathVariables: Record<string, string>
  urlParams: URLSearchParams
} =>
  // Loop over all parameters and build up our request segments
  parameters.reduce(
    (acc, param) => {
      const example = getExample(param, exampleKey, contentType)

      // Skip disabled examples
      if (!example || example['x-disabled']) {
        return acc
      }

      /** Replace environment variables in the example value */
      const replacedValue = typeof example.value === 'string' ? replaceEnvVariables(example.value, env) : example.value

      // Handle headers
      if (param.in === 'header') {
        const lowerCaseKey = param.name.trim().toLowerCase()

        // Ensure we remove the mutlipart/form-data header so fetch can properly set boundaries
        if (lowerCaseKey !== 'content-type' || example.value !== 'multipart/form-data') {
          // headers only support simple style which means we separate the value by commas for multiple values
          if (acc.headers[param.name]) {
            acc.headers[param.name] += `,${replacedValue}`
          } else {
            acc.headers[param.name] = replacedValue
          }
        }
      }

      // Handle path parameters
      if (param.in === 'path') {
        acc.pathVariables[param.name] = replacedValue
      }

      // Handle query parameters (currently array only)
      if (param.in === 'query') {
        /** If the parameter should be exploded, defaults to true*/
        const explode = 'explode' in param && param.explode !== undefined ? param.explode : true

        /** Style of the parameter, defaults to form */
        const style = 'style' in param && param.style ? param.style : 'form'

        // explode=true only supported on form style
        if (explode) {
          acc.urlParams.append(param.name, replacedValue)
        }

        // handle the rest of the array styles
        else {
          const existingValue = acc.urlParams.get(param.name)

          // If the parameter already has a value, append the new value with the delimiter
          if (existingValue) {
            const delimiter = getDelimiter(style)
            acc.urlParams.set(param.name, `${existingValue}${delimiter}${replacedValue}`)
          } else {
            acc.urlParams.set(param.name, replacedValue)
          }
        }
      }

      // Handle cookies
      if (param.in === 'cookie') {
        acc.cookies.push(
          coerceValue(xScalarCookieSchema, {
            name: param.name,
            value: replaceVariables(example.value, env),
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
