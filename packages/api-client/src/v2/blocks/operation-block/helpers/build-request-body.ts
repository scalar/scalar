import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
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
  /** Selected content type for the body from the dropdown, stored as x-scalar-selected-content-type */
  bodyContentType: string,
): BodyInit | null => {
  if (!requestBody) {
    return null
  }

  /** An example value or generated example from the schema */
  const example = getExampleFromBody(requestBody, bodyContentType, exampleKey)
  if (!example?.value) {
    return null
  }

  // Form data
  if (
    (bodyContentType === 'multipart/form-data' || bodyContentType === 'application/x-www-form-urlencoded') &&
    Array.isArray(example.value)
  ) {
    const form = bodyContentType === 'multipart/form-data' ? new FormData() : new URLSearchParams()

    // Loop over all entries and add them to the form
    example.value.forEach(({ name, value }: { name: string; value: string | File }) => {
      if (!name) {
        return
      }
      const replacedName = replaceEnvVariables(name, env)

      // Handle file uploads
      if (value instanceof File && form instanceof FormData) {
        form.append(replacedName, value)
      }
      // Text input
      else if (typeof value === 'string') {
        form.append(replacedName, replaceEnvVariables(value, env))
      }
    })

    return form
  }

  // Ensure we stringify the example value if it is an object
  if (typeof example.value === 'object') {
    return replaceEnvVariables(JSON.stringify(example.value), env)
  }

  // Return binary or string values
  return typeof example.value === 'string' ? replaceEnvVariables(example.value, env) : example.value
}
