import { isObject } from '@scalar/helpers/object/is-object'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { createSchemaResourceLoader } from './resources'

/** Prepare inline native schemas before server chunking; external AsyncAPI references stay deferred. */
export const loadInlineAsyncApiSchemaResources = async (
  document: AsyncApiDocument,
  origin: string,
  loaders: LoaderPlugin[],
): Promise<void> => {
  const load = createSchemaResourceLoader()
  const schema = async (node: unknown): Promise<void> => {
    if (!isObject(node) || '$ref' in node || typeof node.schemaFormat !== 'string') return
    const resources = await load(node.schemaFormat, node.schema, origin, loaders)
    if (resources) node['x-scalar-schema-resources'] = resources
  }
  const trait = async (node: unknown): Promise<void> => {
    if (!isObject(node) || '$ref' in node) return
    await schema(node.headers)
  }
  const message = async (node: unknown): Promise<void> => {
    if (!isObject(node) || '$ref' in node) return
    await schema(node.payload)
    await trait(node)
    if (Array.isArray(node.traits)) for (const child of node.traits) await trait(child)
    if (Array.isArray(node.oneOf)) for (const child of node.oneOf) await message(child)
  }
  const components = isObject(document.components) && !('$ref' in document.components) ? document.components : {}
  if (isObject(components.schemas)) for (const node of Object.values(components.schemas)) await schema(node)
  if (isObject(components.messages)) for (const node of Object.values(components.messages)) await message(node)
  if (isObject(components.messageTraits)) for (const node of Object.values(components.messageTraits)) await trait(node)
  if (isObject(document.channels)) {
    for (const channel of Object.values(document.channels)) {
      if (!isObject(channel) || '$ref' in channel) continue
      if (isObject(channel.messages)) for (const node of Object.values(channel.messages)) await message(node)
      for (const operation of [
        'publish' in channel ? channel.publish : undefined,
        'subscribe' in channel ? channel.subscribe : undefined,
      ]) {
        if (isObject(operation) && !('$ref' in operation)) await message(operation.message)
      }
    }
  }
}
