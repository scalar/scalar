import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/request-body'

import { getExampleFromBody } from '@/v2/blocks/request-block/helpers/get-request-body-example'

/**
 * Create the fetch request body
 */
export const buildRequestBody = (
  requestBody: RequestBodyObject | undefined,
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
  /** The key of the current example */
  exampleKey = 'default',
): BodyInit | null => {
  if (!requestBody) {
    return null
  }

  /** Selected content type for the body from the dropdown, stored as x-scalar-selected-content-type */
  const bodyContentType =
    requestBody?.['x-scalar-selected-content-type']?.[exampleKey] ??
    Object.keys(requestBody?.content ?? {})[0] ??
    'application/json'

  /** An example value or generated example from the schema */
  const example = getExampleFromBody(requestBody, bodyContentType, exampleKey)
  if (!example) {
    return null
  }

  // Form data - array format (from UI editor)
  if (
    (bodyContentType === 'multipart/form-data' || bodyContentType === 'application/x-www-form-urlencoded') &&
    Array.isArray(example.value)
  ) {
    const exampleValue = example.value.filter((item) => !item.isDisabled) as { name: string; value: string | File }[]
    const form = bodyContentType === 'multipart/form-data' ? new FormData() : new URLSearchParams()

    // Loop over all entries and add them to the form
    exampleValue.forEach(({ name, value }) => {
      if (!name) {
        return
      }
      const replacedName = replaceEnvVariables(name, env)

      // Handle file uploads
      if (value instanceof File && form instanceof FormData) {
        /**
         * We need to unwrap the proxies to get the file name due to the
         * "this" context in the proxy causing an illegal invocation error
         */
        const unwrappedValue = unpackProxyObject(value)
        form.append(replacedName, unwrappedValue, unwrappedValue.name)
      }
      // Text input
      else if (typeof value === 'string') {
        form.append(replacedName, replaceEnvVariables(value, env))
      }
    })

    return form
  }

  // Form data - object format (from schema examples)
  // When the example value is a plain object and content type is form-urlencoded,
  // convert to URLSearchParams instead of JSON stringifying
  if (
    bodyContentType === 'application/x-www-form-urlencoded' &&
    example.value !== null &&
    typeof example.value === 'object' &&
    !Array.isArray(example.value)
  ) {
    const form = new URLSearchParams()

    // Convert object properties to form fields
    for (const [key, value] of Object.entries(example.value)) {
      if (key && value !== undefined && value !== null) {
        const replacedKey = replaceEnvVariables(key, env)
        const stringValue = typeof value === 'string' ? value : String(value)
        form.append(replacedKey, replaceEnvVariables(stringValue, env))
      }
    }

    return form
  }

  // Ensure we stringify the example value if it is an object
  if (typeof example.value === 'object') {
    return replaceEnvVariables(JSON.stringify(example.value), env)
  }

  // Return binary or string values
  return typeof example.value === 'string' ? replaceEnvVariables(example.value, env) : example.value
}
