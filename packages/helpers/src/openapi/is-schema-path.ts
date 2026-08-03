/**
 * OpenAPI keywords whose values are (or contain) Schema Objects. When any of
 * these appears as a keyword segment in a document path, the node lives inside
 * a schema.
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
  // Reusable schemas live under `components/schemas`, and `schemas` is not a
  // fixed keyword anywhere else in the document.
  'schemas',
])

/**
 * OpenAPI keywords whose value is a map with user-defined keys (component
 * names, path templates, media types, status codes, header names, …). A key
 * inside one of these maps is a *name*, never a keyword, so it must not be
 * matched against the schema keywords above — a parameter called `not` or a
 * response called `ErrorSchema` does not put us inside a schema.
 */
const USER_KEYED_MAPS = new Set([
  'paths',
  'webhooks',
  'responses',
  'content',
  'headers',
  'examples',
  'links',
  'encoding',
  'variables',
  'parameters',
  'requestBodies',
  'securitySchemes',
  'pathItems',
  'scopes',
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
 *
 * The path is walked left to right so that segments in user-defined key
 * positions (component names, path templates, header names, …) are never
 * mistaken for schema keywords.
 */
export const isSchemaPath = (path: readonly string[] | undefined): boolean => {
  if (!path) {
    return false
  }

  // Number of upcoming segments that are user-defined map keys rather than keywords.
  let userKeySegments = 0

  for (const segment of path) {
    if (userKeySegments > 0) {
      userKeySegments--
      continue
    }

    // A schema keyword in keyword position means everything below is a schema.
    if (SCHEMA_SEGMENTS.has(segment) || segment.endsWith('Schema')) {
      return true
    }

    // Callbacks nest two user-defined levels: the callback name, then the runtime expression.
    if (segment === 'callbacks') {
      userKeySegments = 2
      continue
    }

    if (USER_KEYED_MAPS.has(segment)) {
      userKeySegments = 1
    }
  }

  return false
}
