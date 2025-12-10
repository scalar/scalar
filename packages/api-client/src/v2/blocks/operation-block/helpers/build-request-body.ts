import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/request-body'

import { getExampleFromBody } from '@/v2/blocks/request-block/helpers/get-request-body-example'

/**
 * Create the fetch request body
 */
export const buildRequestBody = (
  requestBody: RequestBodyObject | undefined,
  exampleKey = 'default',
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
) => {
  if (!requestBody) {
    return null
  }

  const selectedContentType =
    requestBody?.['x-scalar-selected-content-type']?.[exampleKey] ??
    Object.keys(requestBody?.content ?? {})[0] ??
    'application/json'

  const example = getExampleFromBody(requestBody, selectedContentType, exampleKey)

  // We got an example value or generated example from the schema
  if (example?.value) {
    return typeof example.value === 'string' ? replaceEnvVariables(example.value, env) : example.value
  }

  // if (example.body.activeBody === 'formData' && example.body.formData) {
  //   const contentType =
  //     example.body.formData.encoding === 'form-data' ? 'multipart/form-data' : 'application/x-www-form-urlencoded'

  //   const form = example.body.formData.encoding === 'form-data' ? new FormData() : new URLSearchParams()

  //   // Build formData
  //   example.body.formData.value.forEach((entry) => {
  //     if (!entry.enabled || !entry.key) {
  //       return
  //     }

  //     // File upload
  //     if (entry.file && form instanceof FormData) {
  //       form.append(entry.key, entry.file, entry.file.name)
  //     }
  //     // Text input with variable replacement
  //     else if (entry.value !== undefined) {
  //       form.append(entry.key, replaceTemplateVariables(entry.value, env))
  //     }
  //   })
  //   return { body: form, contentType }
  // }

  // if (example.body.activeBody === 'raw') {
  //   return {
  //     body: replaceTemplateVariables(example.body.raw?.value ?? '', env),
  //     contentType: example.body.raw?.encoding,
  //   }
  // }

  // if (example.body.activeBody === 'binary') {
  //   return {
  //     body: example.body.binary,
  //     contentType: example.body.binary?.type,
  //   }
  // }

  return null
}
