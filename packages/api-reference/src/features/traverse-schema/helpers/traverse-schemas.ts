import type { TraversedSchema } from '@/features/traverse-schema/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Handles creating entries for components.schemas */
const createModelEntry = (
  schema: OpenAPIV3_1.SchemaObject,
  name = 'Unkown',
  titlesMap: Map<string, string>,
  getModelId: UseNavState['getModelId'],
): TraversedSchema => {
  const id = getModelId({ name })
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
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  getModelId: UseNavState['getModelId'],
): TraversedSchema[] => {
  const schemas = content.components?.schemas ?? {}
  const untagged: TraversedSchema[] = []

  // For loop has 2x the performance of forEach here
  for (const name in schemas) {
    if (schemas[name]['x-internal'] || schemas[name]['x-scalar-ignore'] || !Object.hasOwn(schemas, name)) {
      continue
    }

    untagged.push(createModelEntry(schemas[name], name, titlesMap, getModelId))
  }

  return untagged
}
