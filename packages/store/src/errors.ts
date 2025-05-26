/**
 * List of error messages
 */
export const ERRORS = {
  REFERENCE_NOT_FOUND: (url: string) => `Reference ${url} not found`,
  HTTP_ERROR: (status: number | string) => `HTTP error! status: ${status}`,
  INVALID_OPENAPI_DOCUMENT: 'Invalid OpenAPI document: Failed to parse the content',
  EXTERNAL_REFERENCE_ERROR_PREFIX: (url: string) => `[external-references] [${url}]`,
  FAILED_TO_FETCH_OPENAPI_DOCUMENT: 'Failed to fetch OpenAPI document',
  INVALID_SPECIFICATION_VERSION: 'Invalid OpenAPI/Swagger document, failed to find a specification version.',
  CANNOT_RESOLVE_EXTERNAL_REFERENCE: (ref: string) =>
    `Cannot resolve external reference without origin or externalReferences: ${ref}`,
} as const
