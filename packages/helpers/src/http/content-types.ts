/**
 * Content types that we automatically add in the client
 */
export const CONTENT_TYPES = {
  'multipart/form-data': 'Multipart Form',
  'application/x-www-form-urlencoded': 'Form URL Encoded',
  'application/octet-stream': 'Binary File',
  'application/json': 'JSON',
  'application/xml': 'XML',
  'application/yaml': 'YAML',
  'application/edn': 'EDN',
  'other': 'Other',
  'none': 'None',
} as const
