import type { SidebarEntry } from '@/features/Sidebar/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Handles creating entries for components.schemas */
const createModelEntry = (
  _schema: OpenAPIV3_1.SchemaObject,
  name = 'Unkown',
  getModelId: UseNavState['getModelId'],
): SidebarEntry => ({
  id: getModelId({ name }),
  title: name,
  deprecated: false,
})

/** Traverse components.schemas to create entries for models */
export const traverseSchemas = (
  content: OpenAPIV3_1.Document,
  getModelId: UseNavState['getModelId'],
): SidebarEntry[] => {
  const schemas = content.components?.schemas ?? {}
  const untagged: SidebarEntry[] = []

  // For loop has 2x the performance of forEach here
  for (const name in schemas) {
    if (schemas[name]['x-internal'] || schemas[name]['x-scalar-ignore'] || !Object.hasOwn(schemas, name)) {
      continue
    }

    untagged.push(createModelEntry(schemas[name], name, getModelId))
  }

  return untagged
}
