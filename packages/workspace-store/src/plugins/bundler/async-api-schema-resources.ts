import { isObject } from '@scalar/helpers/object/is-object'
import type { LifecyclePlugin } from '@scalar/json-magic/bundle'

import { deferSchemaResources } from '@/helpers/async-api-schema-resources/resources'

/** Defer native dependencies only at real AsyncAPI schema wrappers, never inside examples or extensions. */
export const asyncApiSchemaResources = (): LifecyclePlugin => {
  return {
    type: 'lifecycle',
    onBeforeNodeProcess: (node, context) => {
      if (context.referenceContext !== 'asyncapi-schema' || typeof node.schemaFormat !== 'string' || '$ref' in node)
        return
      // Completed server graphs stay portable. Deferred metadata must use the actual containing file,
      // since its origin controls future downloads and may have been supplied by the document author.
      const existing = node['x-scalar-schema-resources']
      if (existing !== undefined && !(isObject(existing) && existing.deferred === true)) return
      const resources = deferSchemaResources(node.schemaFormat, context.origin)
      if (resources) node['x-scalar-schema-resources'] = resources
    },
  }
}
