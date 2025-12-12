import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/request-body'

import { getExampleFromBody } from '@/v2/blocks/request-block/helpers/get-request-body-example'

/**
 * Create the fetch request body
 */
export const buildRequestBody = (
  requestBody: RequestBodyObject | undefined,
  exampleKey = 'default',
  contentType: string,
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
): BodyInit | null => {
  if (!requestBody) {
    return null
  }

  const example = getExampleFromBody(requestBody, contentType, exampleKey)

  // We got an example value or generated example from the schema
  if (example?.value) {
    // Form data
    if (
      (contentType === 'multipart/form-data' || contentType === 'application/x-www-form-urlencoded') &&
      Array.isArray(example.value)
    ) {
      const form = contentType === 'multipart/form-data' ? new FormData() : new URLSearchParams()

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

    return typeof example.value === 'string' ? replaceEnvVariables(example.value, env) : example.value
  }

  return null
}
