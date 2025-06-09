import { getTag } from '@/features/traverse-schema/helpers/get-tag'
import type { TagsMap, TraversedSchema } from '@/features/traverse-schema/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Handles creating entries for components.schemas */
const createModelEntry = (
  schema: OpenAPIV3_1.SchemaObject,
  name = 'Unkown',
  titlesMap: Map<string, string>,
  getModelId: UseNavState['getModelId'],
  tag?: OpenAPIV3_1.TagObject,
): TraversedSchema => {
  const id = getModelId({ name }, tag)
  titlesMap.set(id, name)

  return {
    id,
    title: name,
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
  const schemas = content.components?.schemas ?? {}
  const untagged: TraversedSchema[] = []

  for (const name in schemas) {
    if (schemas[name]['x-internal'] || schemas[name]['x-scalar-ignore'] || !Object.hasOwn(schemas, name)) {
      continue
    }

    // Add to tags
    if (schemas[name]['x-tags']?.length) {
      schemas[name]['x-tags'].forEach((tagName: string) => {
        const { tag } = getTag(tagsMap, tagName)
        tagsMap.get(tagName)?.entries.push(createModelEntry(schemas[name], name, titlesMap, getModelId, tag))
      })
    }
    // Add to untagged
    else {
      untagged.push(createModelEntry(schemas[name], name, titlesMap, getModelId))
    }
  }

  return untagged
}
