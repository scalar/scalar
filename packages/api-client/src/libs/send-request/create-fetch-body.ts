import { replaceTemplateVariables } from '@/libs/string-template'
import type { RequestExample, RequestMethod } from '@scalar/oas-utils/entities/spec'
import { canMethodHaveBody } from '@scalar/oas-utils/helpers'

/**
 * Create the fetch request body from an example
 *
 * TODO: Should we be setting the content type headers here?
 * If so we must allow the user to override the content type header
 */
export function createFetchBody(method: RequestMethod, example: RequestExample, env: object) {
  if (!canMethodHaveBody(method)) {
    return { body: undefined, contentType: undefined }
  }

  if (example.body.activeBody === 'formData' && example.body.formData) {
    const contentType =
      example.body.formData.encoding === 'form-data' ? 'multipart/form-data' : 'application/x-www-form-urlencoded'

    const form = example.body.formData.encoding === 'form-data' ? new FormData() : new URLSearchParams()

    // Build formData
    example.body.formData.value.forEach((entry) => {
      if (!entry.enabled || !entry.key) {
        return
      }

      // File upload
      if (entry.file && form instanceof FormData) {
        form.append(entry.key, entry.file, entry.file.name)
      }
      // Text input with variable replacement
      else if (entry.value !== undefined) {
        form.append(entry.key, replaceTemplateVariables(entry.value, env))
      }
    })
    return { body: form, contentType }
  }

  if (example.body.activeBody === 'raw') {
    return {
      body: replaceTemplateVariables(example.body.raw?.value ?? '', env),
      contentType: example.body.raw?.encoding,
    }
  }

  if (example.body.activeBody === 'binary') {
    return {
      body: example.body.binary,
      contentType: example.body.binary?.type,
    }
  }

  return {
    body: undefined,
    contentType: undefined,
  }
}
