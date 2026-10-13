import { isSchemaPath } from '@scalar/helpers/openapi/is-schema-path'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { traverse } from '@/helpers/traverse'

import { collapseAnnotationOnlyAllOf, collectReferencedPointers } from './collapse-annotation-only-all-of'

// Segments whose value is a map of *named* subschemas. Keys inside these maps are
// arbitrary names (property names, definition names), never schema keywords.
const NAMED_SCHEMA_MAP_SEGMENTS = new Set(['properties', 'patternProperties', '$defs', 'definitions'])

/**
 * Determine if the node at `path` is a map of named subschemas rather than a schema object.
 *
 * This matters because the 3.0 to 3.1 upgrade rewrites the `example` keyword into `examples`.
 * A key called `example` (or `examples`) inside one of these maps is a member *name*, not the
 * schema keyword, so it must be left untouched.
 */
function isNamedSchemaMap(path: string[] | undefined): boolean {
  const last = path?.[path.length - 1]

  if (last === undefined) {
    return false
  }

  // OpenAPI's named-schema map lives at components/schemas
  if (last === 'schemas' && path?.[path.length - 2] === 'components') {
    return true
  }

  return NAMED_SCHEMA_MAP_SEGMENTS.has(last)
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
function isInsideDataValue(path: string[] | undefined): boolean {
  if (!path) {
    return false
  }

  for (const [index, segment] of path.entries()) {
    // Only treat it as data when the keyword is a real keyword. Inside a named-schema map the
    // same word (e.g. a property literally called `default`) is just a member name.
    if (DATA_KEYWORDS.has(segment) && !isNamedSchemaMap(path.slice(0, index)) && !isDefaultResponse(path, index)) {
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

// Keywords that only describe a schema. An arm made of these and `nullable` constrains nothing else.
const ANNOTATION_KEYWORDS = new Set([
  'title',
  'description',
  'deprecated',
  'example',
  'examples',
  'externalDocs',
  'readOnly',
  'writeOnly',
])

/**
 * Determine if the node at `path` is one arm of a `oneOf` or `anyOf`.
 *
 * Only array elements get a numeric segment from the traversal, and a named member (a property
 * called `oneOf`) never holds an array, so `oneOf/0` is always an arm.
 */
function isUnionArm(path: string[] | undefined): boolean {
  if (!path || path.length < 2) {
    return false
  }

  const keyword = path[path.length - 2]
  const index = path[path.length - 1]

  return (keyword === 'oneOf' || keyword === 'anyOf') && index !== undefined && /^\d+$/.test(index)
}

/**
 * Determine if a schema carries `nullable: true` and nothing else but annotations and extensions.
 */
function isNullableOnly(schema: UnknownObject): boolean {
  return Object.keys(schema).every((key) => key === 'nullable' || ANNOTATION_KEYWORDS.has(key) || key.startsWith('x-'))
}

/**
 * Upgrade from OpenAPI 3.0.x to 3.1.1
 *
 * https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
 */
export function upgradeFromThreeToThreeOne(originalContent: UnknownObject) {
  let content = originalContent

  // Version check - early return if not 3.0.x
  if (content === null || typeof content.openapi !== 'string' || !content.openapi.startsWith('3.0')) {
    return content
  }

  content.openapi = '3.1.1'

  // Read before anything is rewritten: the `allOf` collapse must leave every node a `$ref` reaches alone.
  const referencedPointers = collectReferencedPointers(content)

  // Single traversal that handles all transformations
  content = traverse(content, (schema, path) => applyChangesToDocument(schema, path, referencedPointers))

  return content as OpenAPIV3_1.Document
}

const applyChangesToDocument = (
  originalSchema: UnknownObject,
  path: string[] | undefined,
  referencedPointers: ReadonlySet<string>,
) => {
  // 0. Bail out inside data values (example, default, const, enum). These hold user data, not a
  // schema, so none of the schema transforms below apply and running them would corrupt the data.
  if (isInsideDataValue(path)) {
    return originalSchema
  }

  // 0b. Drop `allOf` members that only carry annotations, the 3.0 workaround for documenting a
  // `$ref`. Runs before the nullable handling so `nullable` next to such a wrapper sees one member.
  const schema = collapseAnnotationOnlyAllOf(originalSchema, path ?? [], referencedPointers)

  // 1. Handle nullable types
  if (schema.type !== undefined && schema.nullable === true) {
    schema.type = [schema.type, 'null']
    delete schema.nullable
  }
  // 1b. Handle nullable `$ref` patterns.
  // OpenAPI 3.0 had no way to mark a `$ref` as nullable, so people wrote `nullable: true` next to
  // a `$ref`, or next to an `allOf` wrapping one. `nullable` does not exist in 3.1, so leaving these
  // untouched would silently drop the null option. Rewrite them to the 3.1 null-union form. This only
  // runs when there is no sibling `type` (that case is handled above).
  else if (schema.nullable === true && schema.type === undefined) {
    if (typeof schema.$ref === 'string') {
      const { nullable: _nullable, $ref, ...rest } = schema
      return { ...rest, anyOf: [{ $ref }, { type: 'null' }] }
    }

    if (Array.isArray(schema.allOf)) {
      const { nullable: _nullable, allOf, ...rest } = schema
      // A single-member `allOf` unwraps so the union reads `anyOf: [<member>, { type: 'null' }]`.
      const base = allOf.length === 1 ? allOf[0] : { allOf }
      return { ...rest, anyOf: [base, { type: 'null' }] }
    }

    // A union arm that says nothing but `nullable: true` is how some 3.0 exporters spell "or null":
    // `oneOf: [{ nullable: true }, { $ref: X }]`. Left alone, the arm reads as "any value" in 3.1 and
    // swallows the real arm, so it becomes the `{ type: 'null' }` arm it was meant to be.
    if (isUnionArm(path) && isNullableOnly(schema)) {
      delete schema.nullable
      schema.type = 'null'
    }

    // Otherwise there is nothing for `nullable` to attach to, so leave the schema untouched.
  }

  // 2. Handle exclusiveMinimum and exclusiveMaximum
  if (schema.exclusiveMinimum === true && schema.minimum !== undefined) {
    schema.exclusiveMinimum = schema.minimum
    delete schema.minimum
  } else if (typeof schema.exclusiveMinimum === 'boolean') {
    delete schema.exclusiveMinimum
  }

  if (schema.exclusiveMaximum === true && schema.maximum !== undefined) {
    schema.exclusiveMaximum = schema.maximum
    delete schema.maximum
  } else if (typeof schema.exclusiveMaximum === 'boolean') {
    delete schema.exclusiveMaximum
  }

  // 3. Handle examples
  // Skip conversion if we're already inside an examples map to avoid double nesting
  // Check if 'examples' appears as an exact path segment (not just a substring)
  // BUT exclude cases where 'examples' is just a named-schema-map member (e.g. a property named 'examples')
  const isInsideExamplesMap = path?.some((segment, index) => {
    if (segment === 'examples' && index > 0) {
      // If the parent node is a named-schema map, 'examples' is a member name, not an examples map
      return !isNamedSchemaMap(path.slice(0, index))
    }
    return false
  })

  // If the current node is itself a map of named subschemas, a key called 'example' is a
  // member name (property, $defs entry, components/schemas entry) and not the schema keyword.
  if (schema.example !== undefined && !isInsideExamplesMap && !isNamedSchemaMap(path)) {
    if (isSchemaPath(path)) {
      schema.examples = [schema.example]
    } else {
      schema.examples = {
        default: {
          value: schema.example,
        },
      }
    }

    delete schema.example
  }

  // 4. Handle older formats
  const { format: _, ...rest } = schema

  if (schema.type === 'string' || (Array.isArray(schema.type) && schema.type.includes('string'))) {
    if (schema.format === 'binary') {
      // Raw binary is outside JSON Schema's types, including nullable type unions.
      const { type: _type, ...binarySchema } = rest
      const hasMediaType = path?.at(-1) === 'schema' && path.at(-3) === 'content'

      // A whole-body schema already has its media type. Reusable schemas and multipart
      // properties need a fallback, while explicit Encoding Objects remain authoritative.
      return hasMediaType ? binarySchema : { contentMediaType: 'application/octet-stream', ...binarySchema }
    }

    if (schema.format === 'base64' || schema.format === 'byte') {
      // The surrounding media type describes the container, not necessarily the
      // encoded bytes. Preserve an explicit contentMediaType without guessing one.
      return {
        ...rest,
        contentEncoding: 'base64',
      }
    }
  }

  // 5. Handle x-webhooks
  // `x-webhooks` is a document-root extension, so only rename it there. Anywhere else (a schema
  // property, an example) a key named `x-webhooks` is unrelated and must be left alone.
  if (schema['x-webhooks'] !== undefined && (path === undefined || path.length === 0)) {
    schema.webhooks = schema['x-webhooks']
    delete schema['x-webhooks']
  }

  return schema
}
