/** Human readable label for each supported document type */
export const DOCUMENT_TYPE_LABELS = {
  openapi: 'OpenAPI',
  asyncapi: 'AsyncAPI',
} as const

export type DocumentType = keyof typeof DOCUMENT_TYPE_LABELS

/**
 * Best-effort guess of the document type from a source URL.
 *
 * Used as a fallback for URL documents that haven't been loaded yet, since we cannot
 * inspect their content. Many URLs hint at the type (e.g. `.../openapi.json`,
 * `.../asyncapi.yaml`, `.../swagger.json`).
 */
export const guessDocumentTypeFromUrl = (url: string | undefined): DocumentType | undefined => {
  const normalized = url?.toLowerCase()

  if (!normalized) {
    return undefined
  }
  if (normalized.includes('asyncapi')) {
    return 'asyncapi'
  }
  if (normalized.includes('openapi') || normalized.includes('swagger')) {
    return 'openapi'
  }

  return undefined
}
