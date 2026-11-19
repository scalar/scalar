import { isObject } from '@scalar/helpers/object/is-object'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { resolveTraits } from '../resolve-traits'
import { unpackProxyShallow } from '../unpack-proxy'
import { createSchemaResourceLoader, deferSchemaResources } from './resources'
import { getInlineAsyncApiSchemaWrappers } from './schema-wrappers'

/** Prepare inline native schemas before server chunking; external AsyncAPI references stay deferred. */
export const loadInlineAsyncApiSchemaResources = async (
  document: AsyncApiDocument,
  origin: string,
  loaders: LoaderPlugin[],
  options: { lazy?: boolean } = {},
): Promise<void> => {
  const load = createSchemaResourceLoader()
  const legacy = /^2\./.test(document.asyncapi)
  const wrappers = getInlineAsyncApiSchemaWrappers(document, (node) => {
    if (legacy && 'payload' in node) {
      const format = resolveTraits(node, Array.isArray(node.traits) ? node.traits.filter(isObject) : []).schemaFormat
      if (typeof format === 'string') node.payload = { schemaFormat: format, schema: node.payload }
    }
  })
  const loaded = new WeakSet<object>()
  for (const { node } of wrappers) {
    const identity = unpackProxyShallow(node)
    if (loaded.has(identity)) continue
    loaded.add(identity)
    if (typeof node.schemaFormat !== 'string') continue
    const resources = options.lazy
      ? deferSchemaResources(node.schemaFormat, origin)
      : await load(node.schemaFormat, node.schema, origin, loaders)
    if (resources) node['x-scalar-schema-resources'] = resources
  }
}
