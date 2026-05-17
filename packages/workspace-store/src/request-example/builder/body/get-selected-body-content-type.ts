import type { RequestBodyObject } from '@scalar/types/openapi/3.1'

/**
 * Returns the selected body content type for the given request body and exampleKey.
 * Priority:
 *   1. requestBody?.['x-scalar-selected-content-type']?.[exampleKey] (if set)
 *   2. First key in requestBody?.content (if available)
 *   3. null (if none available)
 */
export const getSelectedBodyContentType = (
  requestBody: RequestBodyObject | undefined,
  exampleKey: string = 'default',
): string | null => {
  return (
    requestBody?.['x-scalar-selected-content-type']?.[exampleKey] ?? Object.keys(requestBody?.content ?? {})[0] ?? null
  )
}
