import type { LifecyclePlugin } from '@scalar/json-magic/bundle'

import { createSchemaResourceLoader } from '@/helpers/async-api-schema-resources/resources'

/** Load native dependencies only at real AsyncAPI schema wrappers, never inside examples or extensions. */
export const asyncApiSchemaResources = (): LifecyclePlugin => {
  const load = createSchemaResourceLoader()
  return {
    type: 'lifecycle',
    onBeforeNodeProcess: async (node, context) => {
      if (context.referenceContext !== 'asyncapi-schema' || typeof node.schemaFormat !== 'string' || '$ref' in node)
        return
      // Serialized workspace/SSR graphs carry their origin through relocation. Authored copies are inert
      // data: readers validate and bound them, no credentials or loader capabilities are restored here.
      // Editable-document cleanup removes these graphs before an authored change is ingested again.
      if (node['x-scalar-schema-resources'] !== undefined) return
      const resources = await load(node.schemaFormat, node.schema, context.origin, context.loaders)
      if (resources) node['x-scalar-schema-resources'] = resources
    },
  }
}
