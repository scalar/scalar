import { isSchemaPath } from '@scalar/helpers/openapi/is-schema-path'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { isInsideDataValue, isNamedSchemaMap } from '@/helpers/is-inside-data-value'
import { traverse } from '@/helpers/traverse'

// Keywords that only describe a schema. An arm made of these and `nullable` constrains nothing else.
const ANNOTATION_KEYWORDS = new Set([
  'title',
  'description',
  'deprecated',
  'default',
  'example',
  'examples',
  'externalDocs',
  'readOnly',
  'writeOnly',
])

// These maps hold author-chosen names, so an `x-` prefix there is not an extension keyword.
const NAMED_OPENAPI_MAPS = new Set([
  'paths',
  'webhooks',
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

/** Keep extension payloads opaque, including extensions outside Schema Objects. */
const isInsideExtension = (path: string[] | undefined): boolean => {
  // Bundled resources contain schemas or OpenAPI objects rather than extension data.
  const segments = path?.[0] === 'x-ext' && path[1] !== undefined ? path.slice(2) : path
  if (!segments) {
    return false
  }

  let namedSegments = 0
  for (const [index, segment] of segments.entries()) {
    if (namedSegments > 0) {
      namedSegments--
      continue
    }

    // This legacy root extension is migrated as a Webhooks Object below.
    const keyword = index === 0 && path?.[0] === 'x-webhooks' ? 'webhooks' : segment
    if (keyword.startsWith('x-')) {
      return true
    }

    const parent = segments.slice(0, index)
    if (isNamedSchemaMap([...parent, keyword])) {
      namedSegments = 1
    } else if (!isSchemaPath(parent)) {
      if (keyword === 'callbacks') {
        namedSegments = 2
      } else if (NAMED_OPENAPI_MAPS.has(keyword) || (keyword === 'responses' && parent.at(-1) === 'components')) {
        namedSegments = 1
      }
    }
  }

  return false
}

/** Keep schema keywords separate from author-chosen names. */
const isSchemaObjectPath = (path: string[] | undefined): boolean => {
  // Bundled external resources can be standalone schemas without an enclosing `schema` field.
  const schemaPath = path?.[0] === 'x-ext' && path[1] !== undefined ? ['schema', ...path.slice(2)] : path

  return !!schemaPath && isSchemaPath(schemaPath) && !isNamedSchemaMap(schemaPath) && !isInsideExtension(path)
}

/** Determine if the node at `path` is one arm of a schema's `oneOf` or `anyOf`. */
function isUnionArm(path: string[] | undefined): boolean {
  if (!path || path.length < 2 || !isSchemaObjectPath(path.slice(0, -2))) {
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

  // Single traversal that handles all transformations
  content = traverse(content, applyChangesToDocument)

  return content as OpenAPIV3_1.Document
}

/** Apply one migration step to a node at its semantic OpenAPI location. */
export const applyChangesToDocument = (schema: UnknownObject, path?: string[]) => {
  // Data values and extension payloads are opaque, even when their keys look like schema keywords.
  if (isInsideDataValue(path, '3.0') || isInsideExtension(path)) {
    return schema
  }

  // Only schema keywords migrate: a property named `nullable` or an extension payload is data.
  if (isSchemaObjectPath(path)) {
    if (schema.type !== undefined && schema.nullable === true) {
      schema.type = [schema.type, 'null']
    } else if (schema.nullable === true) {
      // Preserve the legacy nullable-reference spelling used by OpenAPI 3.0 exporters.
      if (typeof schema.$ref === 'string') {
        schema.anyOf = [{ $ref: schema.$ref }, { type: 'null' }]
        delete schema.$ref
      } else if (['allOf', 'anyOf', 'oneOf'].some((keyword) => Array.isArray(schema[keyword]))) {
        const { allOf, anyOf, oneOf } = schema
        const composition = {
          ...(allOf === undefined ? {} : { allOf }),
          ...(anyOf === undefined ? {} : { anyOf }),
          ...(oneOf === undefined ? {} : { oneOf }),
        }
        // Keep sibling constraints and annotations outside the union, as for nullable references.
        const base =
          Object.keys(composition).length === 1 && Array.isArray(allOf) && allOf.length === 1 ? allOf[0] : composition
        schema.anyOf = [base, { type: 'null' }]
        delete schema.allOf
        delete schema.oneOf
      } else if (isUnionArm(path) && isNullableOnly(schema)) {
        // Some exporters use a nullable-only alternative to mean "or null".
        schema.type = 'null'
      }
    }

    // `nullable: false` and an untyped nullable without a union add no constraints in 3.1.
    delete schema.nullable
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
