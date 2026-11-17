import { isObject } from '@scalar/helpers/object/is-object'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'

import { createSchemaResourceLoader } from './resources'

/** Prepare inline native schemas before server chunking; external AsyncAPI references stay deferred. */
export const loadInlineAsyncApiSchemaResources = async (
  document: Record<string, unknown>,
  origin: string,
  loaders: LoaderPlugin[],
): Promise<void> => {
  const load = createSchemaResourceLoader()
  const schema = async (node: unknown): Promise<void> => {
    if (!isObject(node) || '$ref' in node || typeof node.schemaFormat !== 'string') return
    const resources = await load(node.schemaFormat, node.schema, origin, loaders)
    if (resources) node['x-scalar-schema-resources'] = resources
  }
  const message = async (node: unknown): Promise<void> => {
    if (!isObject(node) || '$ref' in node) return
    await schema(node.payload)
    await schema(node.headers)
    if (Array.isArray(node.oneOf)) for (const child of node.oneOf) await message(child)
  }
  const components = isObject(document.components) && !('$ref' in document.components) ? document.components : {}
  if (isObject(components.schemas)) for (const node of Object.values(components.schemas)) await schema(node)
  if (isObject(components.messages)) for (const node of Object.values(components.messages)) await message(node)
  if (isObject(document.channels)) {
    for (const channel of Object.values(document.channels)) {
      if (!isObject(channel) || '$ref' in channel) continue
      if (isObject(channel.messages)) for (const node of Object.values(channel.messages)) await message(node)
      for (const operation of [channel.publish, channel.subscribe]) {
        if (isObject(operation) && !('$ref' in operation)) await message(operation.message)
      }
    }
  }
}
