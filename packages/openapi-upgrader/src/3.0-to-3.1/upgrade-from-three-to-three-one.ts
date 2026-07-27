import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { traverse } from '@/helpers/traverse'

// Create Sets for faster schema path lookups
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

/** Determine if the current path is within a schema - optimized version */
export function isSchemaPath(path: string[] | undefined): boolean {
  // Early return if path is undefined
  if (!path) {
    return false
  }

  // Check for schema segments first (most common case)
  if (path.some((segment) => SCHEMA_SEGMENTS.has(segment))) {
    return true
  }

  // Check for schema suffix
  if (path.some((segment) => segment.endsWith('Schema'))) {
    return true
  }

  // Check for components/schemas path
  if (path.length >= 2 && path[0] === 'components' && path[1] === 'schemas') {
    return true
  }

  return false
}

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
export function isNamedSchemaMap(path: string[] | undefined): boolean {
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

const applyChangesToDocument = (schema: UnknownObject, path?: string[]) => {
  // 1. Handle nullable types
  if (schema.type !== undefined && schema.nullable === true) {
    schema.type = [schema.type, 'null']
    delete schema.nullable
  }

  // 2. Handle exclusiveMinimum and exclusiveMaximum
  if (schema.exclusiveMinimum === true) {
    schema.exclusiveMinimum = schema.minimum
    delete schema.minimum
  } else if (schema.exclusiveMinimum === false) {
    delete schema.exclusiveMinimum
  }

  if (schema.exclusiveMaximum === true) {
    schema.exclusiveMaximum = schema.maximum
    delete schema.maximum
  } else if (schema.exclusiveMaximum === false) {
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

  // 4. Handle multipart file uploads
  if (schema.type === 'object' && schema.properties !== undefined) {
    const parentPath = path?.slice(0, -1)
    const isMultipart = parentPath?.some((segment, index) => {
      return segment === 'content' && path?.[index + 1] === 'multipart/form-data'
    })

    if (isMultipart && schema.properties !== null) {
      for (const value of Object.values(schema.properties)) {
        if (
          typeof value === 'object' &&
          value !== null &&
          'type' in value &&
          'format' in value &&
          value.type === 'string' &&
          value.format === 'binary'
        ) {
          value.contentMediaType = 'application/octet-stream'

          delete value.format
        }
      }
    }
  }

  // 5. Handle binary file uploads
  if (path?.includes('content') && path?.includes('application/octet-stream')) {
    return {}
  }

  // 6. Handle older formats
  const { format: _, ...rest } = schema

  if (schema.type === 'string') {
    if (schema.format === 'binary') {
      return {
        ...rest,
        type: 'string',
        contentMediaType: 'application/octet-stream',
      }
    }

    if (schema.format === 'base64') {
      return {
        ...rest,
        type: 'string',
        contentEncoding: 'base64',
      }
    }

    if (schema.format === 'byte') {
      const parentPath = path?.slice(0, -1)
      const contentMediaType = parentPath?.find((_, index) => path?.[index - 1] === 'content')
      return {
        ...rest,
        type: 'string',
        contentEncoding: 'base64',
        contentMediaType,
      }
    }
  }

  // 7. Handle x-webhooks
  if (schema['x-webhooks'] !== undefined) {
    schema.webhooks = schema['x-webhooks']
    delete schema['x-webhooks']
  }

  return schema
}
