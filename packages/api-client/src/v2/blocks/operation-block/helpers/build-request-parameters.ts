import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import {
  type XScalarCookie,
  xScalarCookieSchema,
} from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getDelimiter } from '@/v2/blocks/operation-block/helpers/get-delimiter'
import { getExample } from '@/v2/blocks/operation-block/helpers/get-example'

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

      /** Replace environment variables in the key and value */
      const replacedValue = typeof example.value === 'string' ? replaceEnvVariables(example.value, env) : example.value
      const paramName = replaceEnvVariables(param.name, env)

      // Handle headers
      if (param.in === 'header') {
        const lowerCaseKey = paramName.trim().toLowerCase()

        // Ensure we remove the mutlipart/form-data header so fetch can properly set boundaries
        if (lowerCaseKey !== 'content-type' || example.value !== 'multipart/form-data') {
          // headers only support simple style which means we separate the value by commas for multiple values
          if (acc.headers[paramName]) {
            acc.headers[paramName] += `,${replacedValue}`
          } else {
            acc.headers[paramName] = replacedValue
          }
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

        // explode=true only supported on form style
        if (explode) {
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
            value: replaceEnvVariables(example.value, env),
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
