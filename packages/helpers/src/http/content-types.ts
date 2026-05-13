/**
 * Built-in content types that we offer as primary choices in the request body content type dropdown.
 *
 * Additional content types defined on the OpenAPI request body (for example `text/csv` or `application/pdf`)
 * are appended dynamically at the UI level and do not need to be listed here.
 */
export const CONTENT_TYPES = {
  'multipart/form-data': 'Multipart Form',
  'application/x-www-form-urlencoded': 'Form URL Encoded',
  'application/octet-stream': 'Binary File',
  'application/json': 'JSON',
  'application/xml': 'XML',
  'application/yaml': 'YAML',
  'application/edn': 'EDN',
  /**
   * Raw body without an automatic `Content-Type` header (user may set one manually).
   */
  'other': 'Other',
  'none': 'None',
} as const
