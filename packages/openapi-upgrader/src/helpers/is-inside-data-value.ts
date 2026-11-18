// Segments whose value is a map of *named* subschemas. Keys inside these maps are
// arbitrary names (property names, definition names), never schema keywords.
const NAMED_SCHEMA_MAP_SEGMENTS = new Set(['properties', 'patternProperties', '$defs', 'definitions'])

/** Identify response, parameter, and header names so their spelling cannot turn them into schema keywords. */
const isOpenApiObjectName = (path: readonly string[], index: number): boolean =>
  (index === 1 && (path[0] === 'responses' || path[0] === 'parameters')) ||
  (index === 2 && path[0] === 'components' && (path[1] === 'responses' || path[1] === 'parameters')) ||
  // A reusable object or header named `headers` is not itself a header map.
  (path[index - 1] === 'headers' &&
    !isOpenApiObjectName(path, index - 1) &&
    !isNamedSchemaMap(path.slice(0, index - 1)))

/**
 * Determine if the node at `path` is a map of named subschemas rather than a schema object.
 *
 * This matters because the 3.0 to 3.1 upgrade rewrites the `example` keyword into `examples`.
 * A key called `example` (or `examples`) inside one of these maps is a member *name*, not the
 * schema keyword, so it must be left untouched.
 */
export function isNamedSchemaMap(path: string[] | undefined): boolean {
  const last = path?.[path.length - 1]

  if (!path || last === undefined || isOpenApiObjectName(path, path.length - 1)) {
    return false
  }

  // OpenAPI's named-schema map lives at components/schemas
  if (last === 'schemas' && path?.[path.length - 2] === 'components') {
    return true
  }

  // A member of a named-schema map is a schema, even when its name is another map keyword.
  return NAMED_SCHEMA_MAP_SEGMENTS.has(last) && !isNamedSchemaMap(path?.slice(0, -1))
}

/**
 * Determine if `path[index]` is the `default` entry of a Responses Object.
 *
 * That `default` is a response, not the `default` keyword, so everything under it (its schemas
 * included) still has to be upgraded. A schema property literally called `responses` does not
 * count: there `default` is the keyword again.
 */
function isDefaultResponse(path: string[], index: number): boolean {
  return path[index] === 'default' && path[index - 1] === 'responses' && !isNamedSchemaMap(path.slice(0, index - 1))
}

// Keywords whose value is arbitrary data rather than a schema. The upgrade rules only make
// sense for schema keywords, so nothing nested under these may be rewritten.
const DATA_KEYWORDS = new Set(['example', 'default', 'const', 'enum'])

/**
 * Determine if the node at `path` lives inside a data value rather than a schema.
 *
 * The traversal visits every object node, but a value held by keywords like `example` or
 * `default` is user data, not a schema. Applying the schema transforms to it would mangle it
 * (turning `nullable: true` into a type array, renaming a nested `x-webhooks`, and so on).
 */
export function isInsideDataValue(path: string[] | undefined, sourceVersion: '2.0' | '3.0'): boolean {
  if (!path) {
    return false
  }

  for (const [index, segment] of path.entries()) {
    // Response, parameter, and header names are arbitrary, just like schema names.
    // Match their document locations so nested data keywords still protect payloads.
    if (isOpenApiObjectName(path, index)) {
      continue
    }

    // Only treat it as data when the keyword is a real keyword. Inside a named-schema map the
    // same word (e.g. a property literally called `default`) is just a member name.
    // Swagger extensions must not classify OpenAPI 3.0 component or callback names as data.
    const isDataKeyword =
      DATA_KEYWORDS.has(segment) || (sourceVersion === '2.0' && (segment === 'x-example' || segment === 'x-examples'))
    if (isDataKeyword && !isNamedSchemaMap(path.slice(0, index)) && !isDefaultResponse(path, index)) {
      return true
    }

    // Swagger 2.0 response examples (`responses/<code>/examples/<mime>`) map media types straight to data.
    if (
      sourceVersion === '2.0' &&
      segment === 'examples' &&
      path[index - 2] === 'responses' &&
      !isNamedSchemaMap(path.slice(0, index - 2))
    ) {
      return true
    }

    // The `value` of an Example Object (`examples/<name>/value`) holds arbitrary data too.
    // Require a real examples map two segments up so a property named `value` inside a schema
    // named `examples` is not mistaken for it.
    if (segment === 'value' && path[index - 2] === 'examples' && !isNamedSchemaMap(path.slice(0, index - 2))) {
      return true
    }
  }

  return false
}
