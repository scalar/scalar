import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
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
const isSchemaObjectPath = (path: string[] | undefined): boolean =>
  !!path && isSchemaPath(path) && !isNamedSchemaMap(path) && !isInsideExtension(path)

/** Give a referenced standalone schema the same context as an inline Schema Object. */
const getSchemaPath = (path: string[] | undefined, schemaPaths: ReadonlySet<string>): string[] | undefined => {
  if (path?.[0] !== 'x-ext') {
    return path
  }

  for (let length = path.length; length >= 2; length--) {
    if (schemaPaths.has(JSON.stringify(path.slice(0, length)))) {
      return ['schema', ...path.slice(length)]
    }
  }

  return path
}

/** Decode the URI fragment before parsing pointer tokens, without decoding literal percent signs twice. */
const parseLocalReference = (ref: string): string[] | undefined => {
  if (!ref.startsWith('#')) {
    return undefined
  }
  try {
    const pointer = decodeURIComponent(ref.slice(1))
    return pointer.startsWith('/') ? parseJsonPointerSegments(pointer.replaceAll('%', '%25')) : undefined
  } catch {
    // Invalid URI escapes must not make an otherwise unrelated migration fail.
    return undefined
  }
}

/** Bundles can contain whole OpenAPI documents or arbitrary fragments, not just schemas. */
const getBundledSchemaPaths = (
  content: UnknownObject,
  preservedResources: ReadonlySet<string>,
): ReadonlySet<string> => {
  const references: { path: string[]; target: string[] }[] = []
  traverse(content, (node, path = []) => {
    if (path[0] === 'x-ext' && preservedResources.has(path[1] ?? '')) {
      return node
    }
    const target = typeof node.$ref === 'string' ? parseLocalReference(node.$ref) : undefined
    if (target?.[0] === 'x-ext') {
      references.push({ path, target })
    }
    return node
  })

  const schemaPaths = new Set<string>()
  // Follow schema references transitively; a standalone schema may itself be only a $ref.
  while (references.length > 0) {
    const pending = references.splice(0)
    for (const reference of pending) {
      const path = getSchemaPath(reference.path, schemaPaths)
      if (isSchemaObjectPath(path) && !isInsideDataValue(path, '3.0')) {
        schemaPaths.add(JSON.stringify(reference.target))
      } else {
        references.push(reference)
      }
    }
    if (references.length === pending.length) {
      break
    }
  }

  return schemaPaths
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

type NullableComposition = { base: unknown; keywords: string[]; unwrapAllOf: boolean }

/** Plan nullable composition wrapping consistently for migrations and reference locations. */
export const getNullableComposition = (schema: UnknownObject): NullableComposition | undefined => {
  if (schema.nullable !== true || schema.type !== undefined || typeof schema.$ref === 'string') {
    return undefined
  }
  const keywords = ['allOf', 'anyOf', 'oneOf'].filter((keyword) => Array.isArray(schema[keyword]))
  if (keywords.length === 0) {
    return undefined
  }
  const { allOf, anyOf, oneOf } = schema
  const composition = {
    ...(allOf === undefined ? {} : { allOf }),
    ...(anyOf === undefined ? {} : { anyOf }),
    ...(oneOf === undefined ? {} : { oneOf }),
  }
  const unwrapAllOf = Object.keys(composition).length === 1 && Array.isArray(allOf) && allOf.length === 1
  return { base: unwrapAllOf && Array.isArray(allOf) ? allOf[0] : composition, keywords, unwrapAllOf }
}

/** Keep local references pointing at the same subschema when composition members move. */
const relocateReference = (ref: string, compositions: ReadonlyMap<string, NullableComposition>): string => {
  const segments = parseLocalReference(ref)
  if (!segments) {
    return ref
  }
  const output: string[] = []
  for (let index = 0; index < segments.length; index++) {
    const keyword = segments[index]!
    const composition = compositions.get(JSON.stringify(segments.slice(0, index)))
    if (composition?.keywords.includes(keyword)) {
      output.push('anyOf', '0')
      if (keyword === 'allOf' && composition.unwrapAllOf && segments[index + 1] === '0') {
        index++
      } else {
        output.push(keyword)
      }
    } else {
      output.push(keyword)
    }
  }
  return output.every((segment, index) => segment === segments[index]) && output.length === segments.length
    ? ref
    : `#/${output.map((segment) => encodeURIComponent(escapeJsonPointer(segment))).join('/')}`
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

  const resources = content['x-ext']
  const preservedResources = new Set(
    isObject(resources)
      ? Object.keys(resources).filter((key) => {
          const resource = resources[key]
          return (
            isObject(resource) &&
            ((typeof resource.openapi === 'string' && !resource.openapi.startsWith('3.0')) ||
              typeof resource.swagger === 'string' ||
              typeof resource.$schema === 'string')
          )
        })
      : [],
  )
  const isPreservedResource = (path: string[] | undefined): boolean =>
    path?.[0] === 'x-ext' && preservedResources.has(path[1] ?? '')
  const schemaPaths = getBundledSchemaPaths(content, preservedResources)
  const compositions = new Map<string, NullableComposition>()
  // Record moves in the original tree before applying them, including nested compositions.
  traverse(content, (node, path = []) => {
    const schemaPath = getSchemaPath(path, schemaPaths)
    const composition = getNullableComposition(node)
    if (
      !isPreservedResource(path) &&
      composition &&
      isSchemaObjectPath(schemaPath) &&
      !isInsideDataValue(schemaPath, '3.0')
    ) {
      compositions.set(JSON.stringify(path), composition)
    }
    return node
  })
  content = traverse(content, (node, path) => {
    if (isPreservedResource(path)) {
      return node
    }
    const schemaPath = getSchemaPath(path, schemaPaths)
    if (typeof node.$ref === 'string' && !isInsideDataValue(schemaPath, '3.0') && !isInsideExtension(schemaPath)) {
      node.$ref = relocateReference(node.$ref, compositions)
    }
    return applyChangesToDocument(node, schemaPath)
  })

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
    const composition = getNullableComposition(schema)
    if (schema.type !== undefined && schema.nullable === true) {
      schema.type = [schema.type, 'null']
    } else if (schema.nullable === true) {
      // Preserve the legacy nullable-reference spelling used by OpenAPI 3.0 exporters.
      if (typeof schema.$ref === 'string') {
        schema.anyOf = [{ $ref: schema.$ref }, { type: 'null' }]
        delete schema.$ref
      } else if (composition) {
        // Keep sibling constraints and annotations outside the union, as for nullable references.
        schema.anyOf = [composition.base, { type: 'null' }]
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
