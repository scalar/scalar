import type { RequestExample } from '@scalar/oas-utils/entities/spec'

import { replaceTemplateVariables } from '@/libs/string-template'

/** Populate the headers from enabled parameters */
export function createFetchHeaders(example: Pick<RequestExample, 'parameters'>, env: object) {
  const headers: NonNullable<RequestInit['headers']> = {}

  example.parameters.headers.forEach((h) => {
    const lowerCaseKey = h.key.trim().toLowerCase()

    // Ensure we remove the mutlipart/form-data header so fetch can properly set boundaries
    if (h.enabled && (lowerCaseKey !== 'content-type' || h.value !== 'multipart/form-data')) {
      headers[lowerCaseKey] = replaceTemplateVariables(h.value, env)
    }
  })

  return headers
}
