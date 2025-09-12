import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { getTag } from '@/navigation/helpers/get-tag'
import type { TagsMap, TraverseSpecOptions } from '@/navigation/types'
import type { OpenApiDocument, SchemaObject, TagObject, TraversedSchema } from '@/schemas/v3.1/strict/openapi-document'

/** Creates a traversed schema entry from an OpenAPI schema object.
 *
 * @param ref - JSON pointer reference to the schema in the OpenAPI document
 * @param name - Name of the schema, defaults to 'Unknown'
 * @param entriesMap - Map to store schema IDs and titles for mobile header navigation
 * @param getModelId - Function to generate unique IDs for schemas
 * @returns A traversed schema entry with ID, title, name and reference
 */
const createSchemaEntry = (
  ref: string,
  name = 'Unknown',
  getModelId: TraverseSpecOptions['getModelId'],
  tag?: TagObject,
  _schema?: SchemaObject,
): TraversedSchema => {
  const id = getModelId({ name }, tag)
  const schema = getResolvedRef(_schema)

  // Use schema.title if available, otherwise fall back to name
  // @see https://json-schema.org/draft/2020-12/json-schema-core#section-4.3.5
  const title = (schema && 'title' in schema && (schema.title as string)) || name

  const entry = {
    id,
    title,
    name,
    ref,
    type: 'model',
  } satisfies TraversedSchema

  return entry
}

/** Traverses the schemas in an OpenAPI document to build an array of model entries.
 *
 * This function processes each schema in components.schemas to:
 * - Filter out internal schemas (marked with x-internal) and schemas to ignore (marked with x-scalar-ignore)
 * - Create model entries with unique references and IDs
 * - Store model IDs and titles for mobile header navigation
 *
 * @param content - The OpenAPI document to traverse
 * @param entitiesMap - Map to store schema IDs and titles for mobile header navigation
 * @param getModelId - Function to generate unique IDs for schemas
 * @returns Array of traversed schema entries
 */
export const traverseSchemas = (
  content: OpenApiDocument,
  /** Map of tagNames and their entries */
  tagsMap: TagsMap,
  getModelId: TraverseSpecOptions['getModelId'],
): TraversedSchema[] => {
  const schemas = content.components?.schemas ?? {}
  const untagged: TraversedSchema[] = []

  // biome-ignore lint/suspicious/useGuardForIn: we do have an if statement after de-ref
  for (const name in schemas) {
    const schema = getResolvedRef(schemas[name])

    if (schema?.['x-internal'] || schema?.['x-scalar-ignore'] || !Object.hasOwn(schemas, name)) {
      continue
    }

    const ref = `#/components/schemas/${name}`

    // Add to tags
    if (schema?.['x-tags']) {
      schema['x-tags'].forEach((tagName: string) => {
        const { tag } = getTag(tagsMap, tagName)
        tagsMap.get(tagName)?.entries.push(createSchemaEntry(ref, name, getModelId, tag))
      })
    }
    // Add to untagged
    else {
      untagged.push(createSchemaEntry(ref, name, getModelId, undefined, getResolvedRef(schemas[name])))
    }
  }

  return untagged
}
