import { getTag } from '@/features/traverse-schema/helpers/get-tag'
import type { TagsMap, TraversedSchema } from '@/features/traverse-schema/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { SchemaObject, TagObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/** Handles creating entries for components.schemas */
const createSchemaEntry = (
  schema: SchemaObject,
  name = 'Unkown',
  titlesMap: Map<string, string>,
  getModelId: UseNavState['getModelId'],
  tag?: TagObject,
): TraversedSchema => {
  const id = getModelId({ name }, tag)

  // Use schema.title if available, otherwise fall back to name
  // @see https://json-schema.org/draft/2020-12/json-schema-core#section-4.3.5
  const title = 'title' in schema && typeof schema.title === 'string' ? schema.title : name

  titlesMap.set(id, title)

  return {
    id,
    title,
    name,
    schema,
  }
}

/** Traverse components.schemas to create entries for models */
export const traverseSchemas = (
  content: OpenAPIV3_1.Document,
  tagsMap: TagsMap,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getModelId: UseNavState['getModelId'],
): TraversedSchema[] => {
  // TODO: Once the whole thing is on the new data structure we can remove this cast.
  const schemas = (content.components?.schemas as Record<string, any>) ?? {}
  const untagged: TraversedSchema[] = []

  for (const name in schemas) {
    if (schemas[name]['x-internal'] || schemas[name]['x-scalar-ignore'] || !Object.hasOwn(schemas, name)) {
      continue
    }

    // Add to tags
    if (schemas[name]['x-tags']?.length) {
      schemas[name]['x-tags'].forEach((tagName: string) => {
        const { tag } = getTag(tagsMap, tagName)

        tagsMap.get(tagName)?.entries.push(createSchemaEntry(schemas[name], name, titlesMap, getModelId, tag))
      })
    }
    // Add to untagged
    else {
      untagged.push(createSchemaEntry(schemas[name], name, titlesMap, getModelId))
    }
  }

  return untagged
}
