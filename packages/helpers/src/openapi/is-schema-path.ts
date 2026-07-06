/**
 * OpenAPI keywords whose values are (or contain) Schema Objects. When any of
 * these appears as a segment in a document path, the node lives inside a schema.
 */
const SCHEMA_SEGMENTS = new Set([
  'properties',
  'items',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'additionalProperties',
  'schema',
])

/**
 * Determine whether a document path points inside a JSON Schema.
 *
 * OpenAPI 3.1 schemas are reachable through a handful of well-known keywords
 * (`schema`, `properties`, `items`, the composition keywords, …), through any
 * `*Schema` keyword (such as `contentSchema`), or directly under
 * `components/schemas`. Knowing this lets callers treat schema `$ref`s — which
 * may legally carry sibling keywords in JSON Schema 2020-12 — differently from
 * plain OpenAPI Reference Objects, where only `summary` and `description` are
 * allowed next to `$ref`.
 */
export const isSchemaPath = (path: readonly string[] | undefined): boolean => {
  if (!path) {
    return false
  }

  // Most schemas are reached through a well-known schema keyword.
  if (path.some((segment) => SCHEMA_SEGMENTS.has(segment))) {
    return true
  }

  // Keywords such as `contentSchema` also introduce a schema.
  if (path.some((segment) => segment.endsWith('Schema'))) {
    return true
  }

  // Reusable schemas live under `components/schemas`.
  return path.length >= 2 && path[0] === 'components' && path[1] === 'schemas'
}
