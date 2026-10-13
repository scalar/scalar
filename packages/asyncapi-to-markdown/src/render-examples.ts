import { isObject } from '@scalar/helpers/object/is-object'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { anchor, createDocumentAnchors, link, paragraph, strong, text } from '@scalar/openapi-to-markdown/markdown'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { RootContent } from 'mdast'

import { object, resolve } from './document'
import { code } from './render-schema'
import { isJsonSchemaFormat } from './schema-format'
import { isPrimitiveSchema } from './schema-view'

/** Bound the generator before expanding a shared or recursive schema graph. */
const size = (input: unknown): number => {
  const cache = new Map<unknown, Map<number, number>>()
  const count = (input: unknown, depth: number): number => {
    const resolved = resolve(input)
    if (!isObject(resolved) || depth > 10) {
      return 1
    }
    const schema = object(resolved)
    if (schema.example !== undefined || (Array.isArray(schema.examples) && schema.examples.length)) {
      return 1
    }
    const identity = getRaw(resolved)
    const previous = cache.get(identity)?.get(depth)
    if (previous !== undefined) {
      return previous
    }
    let total = 1
    const add = (value: unknown): void => {
      if (total <= 10000) {
        total += count(value, depth + 1)
      }
    }
    for (const keyword of ['properties', 'patternProperties'] as const) {
      Object.values(object(schema[keyword])).forEach(add)
    }
    for (const keyword of ['items', 'additionalProperties', 'additionalItems', 'allOf', 'anyOf', 'oneOf'] as const) {
      const value = schema[keyword]
      if (Array.isArray(value)) {
        value.forEach(add)
      } else if (value !== undefined) {
        add(value)
      }
    }
    const levels = cache.get(identity) ?? new Map<number, number>()
    levels.set(depth, total)
    cache.set(identity, levels)
    return total
  }
  return count(input, 0)
}

/** Keep linked model examples local, preserving primitive references and authored data. */
const stubLinkedSchemas = (input: unknown, depth = 0): unknown => {
  if (depth >= 10) {
    return {}
  }
  const schema = object(input)
  if (depth > 0 && isObject(input) && typeof input.$ref === 'string' && !isPrimitiveSchema(schema)) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => {
      if (['properties', 'patternProperties', 'dependencies'].includes(key)) {
        return [
          key,
          Object.fromEntries(
            Object.entries(object(value)).map(([name, child]) => [
              name,
              Array.isArray(child) ? child : stubLinkedSchemas(child, depth + 1),
            ]),
          ),
        ]
      }
      if (
        [
          'items',
          'additionalProperties',
          'additionalItems',
          'allOf',
          'oneOf',
          'anyOf',
          'contains',
          'not',
          'if',
          'then',
          'else',
        ].includes(key)
      ) {
        return [
          key,
          typeof value === 'boolean'
            ? value
            : Array.isArray(value)
              ? value.map((child) => stubLinkedSchemas(child, depth + 1))
              : stubLinkedSchemas(value, depth + 1),
        ]
      }
      return [key, value]
    }),
  )
}

/** Authored values stay local; generated examples are cached and linked within a page. */
export const createExampleRenderer = (): ((
  input: unknown,
  linked?: boolean,
  stubReferences?: boolean,
) => RootContent[]) => {
  const anchors = createDocumentAnchors()
  const generated = new Map<unknown, { id: string; nodes: RootContent[] }>()
  return (input, linked = false, stubReferences = false) => {
    const schema = object(input)
    if ('schema' in schema) {
      // Other schema languages need their own example generators.
      if (!isJsonSchemaFormat(schema.schemaFormat)) {
        return []
      }
      input = schema.schema
    }
    if (resolve(input) === false) {
      return []
    }
    const value = object(input)
    if (value.example !== undefined || (Array.isArray(value.examples) && value.examples.length) || linked) {
      return []
    }
    const identity = getRaw(resolve(input))
    const previous = generated.get(identity)
    if (previous) {
      return previous.nodes.length ? [paragraph(link(`#${previous.id}`, 'Generated example'))] : []
    }
    const exampleSchema = stubReferences ? stubLinkedSchemas(value) : value
    if (size(exampleSchema) > 10000) {
      return [paragraph(text('Generated example omitted because it is too large.'))]
    }
    // The shared generator consumes JSON Schema keywords; AsyncAPI direction does not
    // imply OpenAPI request/response readOnly or writeOnly filtering.
    const example = getExampleFromSchema(exampleSchema as SchemaObject)
    const id = anchors.get('example', String(generated.size + 1))
    const nodes =
      example === undefined ? [] : [anchor(id), paragraph(strong(text('Generated example:'))), code(example)]
    generated.set(identity, { id, nodes })
    return nodes
  }
}
