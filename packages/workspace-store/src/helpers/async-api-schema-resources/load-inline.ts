import { isObject } from '@scalar/helpers/object/is-object'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { getResolvedAsyncApiRef } from '../get-resolved-async-api-ref'
import { createSchemaResourceLoader } from './resources'

/** Prepare inline native schemas before server chunking; external AsyncAPI references stay deferred. */
export const loadInlineAsyncApiSchemaResources = async (
  document: AsyncApiDocument,
  origin: string,
  loaders: LoaderPlugin[],
): Promise<void> => {
  const load = createSchemaResourceLoader()
  const schema = async (value: unknown): Promise<void> => {
    const node = getResolvedAsyncApiRef(value)
    if (!isObject(node) || typeof node.schemaFormat !== 'string') return
    const resources = await load(node.schemaFormat, node.schema, origin, loaders)
    if (resources) node['x-scalar-schema-resources'] = resources
  }
  const trait = async (value: unknown): Promise<void> => {
    const node = getResolvedAsyncApiRef(value)
    if (!isObject(node)) return
    await schema(node.headers)
  }
  const messages = new WeakSet<object>()
  const message = async (value: unknown): Promise<void> => {
    const node = getResolvedAsyncApiRef(value)
    if (!isObject(node) || messages.has(node)) return
    messages.add(node)
    await schema(node.payload)
    await trait(node)
    if (Array.isArray(node.traits)) for (const child of node.traits) await trait(child)
    if (Array.isArray(node.oneOf)) for (const child of node.oneOf) await message(child)
  }
  const channel = async (value: unknown): Promise<void> => {
    const node = getResolvedAsyncApiRef(value)
    if (!isObject(node)) return
    if (isObject(node.messages)) for (const child of Object.values(node.messages)) await message(child)
    for (const operation of [node.publish, node.subscribe]) {
      if (isObject(operation) && !('$ref' in operation)) await message(operation.message)
    }
  }
  const components = getResolvedAsyncApiRef(document.components) ?? {}
  if (isObject(components.schemas)) for (const node of Object.values(components.schemas)) await schema(node)
  if (isObject(components.messages)) for (const node of Object.values(components.messages)) await message(node)
  if (isObject(components.messageTraits)) for (const node of Object.values(components.messageTraits)) await trait(node)
  if (isObject(components.channels)) for (const node of Object.values(components.channels)) await channel(node)
  if (isObject(document.channels)) for (const node of Object.values(document.channels)) await channel(node)
}
