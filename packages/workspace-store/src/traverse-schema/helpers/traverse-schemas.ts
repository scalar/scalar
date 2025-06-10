import type { TraversedSchema, TraverseSpecOptions } from '@/traverse-schema/types'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Creates a traversed schema entry from an OpenAPI schema object.
 *
 * @param ref - JSON pointer reference to the schema in the OpenAPI document
 * @param name - Name of the schema, defaults to 'Unknown'
 * @param titlesMap - Map to store schema IDs and titles for mobile header navigation
 * @param getModelId - Function to generate unique IDs for schemas
 * @returns A traversed schema entry with ID, title, name and reference
 */
const createModelEntry = (
  ref: string,
  name = 'Unknown',
  titlesMap: Map<string, string>,
  getModelId: TraverseSpecOptions['getModelId'],
): TraversedSchema => {
  const id = getModelId({ name })
  titlesMap.set(id, name)

  return {
    id,
    title: name,
    name,
    ref,
    type: 'model',
  }
}

/** Traverses the schemas in an OpenAPI document to build an array of model entries.
 *
 * This function processes each schema in components.schemas to:
 * - Filter out internal schemas (marked with x-internal) and schemas to ignore (marked with x-scalar-ignore)
 * - Create model entries with unique references and IDs
 * - Store model IDs and titles for mobile header navigation
 *
 * @param content - The OpenAPI document to traverse
 * @param titlesMap - Map to store schema IDs and titles for mobile header navigation
 * @param getModelId - Function to generate unique IDs for schemas
 * @returns Array of traversed schema entries
 */
export const traverseSchemas = (
  content: OpenAPIV3_1.Document,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getModelId: TraverseSpecOptions['getModelId'],
): TraversedSchema[] => {
  const schemas = content.components?.schemas ?? {}
  const untagged: TraversedSchema[] = []

  // For loop has 2x the performance of forEach here
  for (const name in schemas) {
    if (schemas[name]['x-internal'] || schemas[name]['x-scalar-ignore'] || !Object.hasOwn(schemas, name)) {
      continue
    }

    const ref = `#/content/components/schemas/${name}`

    untagged.push(createModelEntry(ref, name, titlesMap, getModelId))
  }

  return untagged
}
