import type { LifecyclePlugin } from '@scalar/json-magic/bundle'

import { deferSchemaResources } from '@/helpers/async-api-schema-resources/resources'

/** Defer native dependencies only at real AsyncAPI schema wrappers, never inside examples or extensions. */
export const asyncApiSchemaResources = (): LifecyclePlugin => {
  return {
    type: 'lifecycle',
    onBeforeNodeProcess: (node, context) => {
      if (context.referenceContext !== 'asyncapi-schema' || typeof node.schemaFormat !== 'string' || '$ref' in node)
        return
      // Serialized workspace/SSR graphs carry their origin through relocation. Authored copies are inert
      // data: readers validate and bound them, no credentials or loader capabilities are restored here.
      // Editable-document cleanup removes these graphs before an authored change is ingested again.
      if (node['x-scalar-schema-resources'] !== undefined) return
      const resources = deferSchemaResources(node.schemaFormat, context.origin)
      if (resources) node['x-scalar-schema-resources'] = resources
    },
  }
}
