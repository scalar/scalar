import { HTTP_METHODS } from '@scalar/helpers/http/http-methods'
import { extractPathFromUrl, normalizePath } from '@scalar/postman-to-openapi'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { extractRequestMethod } from '@/v2/features/command-palette/helpers/postman-request-tree'

/**
 * Extracts all path + method merge keys from an OpenAPI document.
 * Returns a Set of merge keys in the format: `${method}\0${path}`
 */
export const getOpenApiMergeKeys = (document: OpenApiDocument): Set<string> => {
  const keys = new Set<string>()

  if (!document.paths) {
    return keys
  }

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!pathItem) {
      continue
    }

    for (const method of HTTP_METHODS) {
      if (method in pathItem && pathItem[method]) {
        const mergeKey = `${method}\0${path}`
        keys.add(mergeKey)
      }
    }
  }

  return keys
}

/**
 * Resolves merge key and server usage for a Postman collection item that has a `request` field.
 */
export const getPostmanMergeKeys = (item: unknown) => {
  if (!item || typeof item !== 'object' || !('request' in item)) {
    return undefined
  }

  const request = item.request
  const method = extractRequestMethod(request).toLowerCase()

  const requestUrl =
    typeof request === 'string'
      ? request
      : typeof (request as { url?: unknown }).url === 'string'
        ? (request as { url: string }).url
        : ((request as { url?: { raw?: string } }).url?.raw ?? '')

  const path = extractPathFromUrl(requestUrl)
  const normalizedPath = normalizePath(path)

  return `${method}\0${normalizedPath}`
}
