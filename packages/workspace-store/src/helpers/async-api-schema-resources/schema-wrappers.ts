import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { getResolvedAsyncApiRef } from '../get-resolved-async-api-ref'
import { unpackProxyShallow } from '../unpack-proxy'

/** Stable schema positions survive object replacement and retain per-location overrides. */
export type InlineAsyncApiSchemaWrapper = { node: Record<string, unknown>; path: string[] }

/** Visit schema positions, including resolved aliases, without treating examples or extensions as schemas. */
export const getInlineAsyncApiSchemaWrappers = (
  document: AsyncApiDocument,
  beforeMessage?: (message: Record<string, unknown>) => void,
): InlineAsyncApiSchemaWrapper[] => {
  const schemas: InlineAsyncApiSchemaWrapper[] = []
  const schema = (value: unknown, path: string[]): void => {
    const node = getResolvedAsyncApiRef(value)
    if (isObject(node) && typeof node.schemaFormat === 'string') schemas.push({ node, path })
  }
  const trait = (value: unknown, path: string[]): void => {
    const node = getResolvedAsyncApiRef(value)
    if (isObject(node)) schema(node.headers, [...path, 'headers'])
  }
  const normalizedMessages = new WeakSet<object>()
  const activeMessages = new WeakSet<object>()
  const message = (value: unknown, path: string[]): void => {
    const node = getResolvedAsyncApiRef(value)
    if (!isObject(node)) return
    const identity = unpackProxyShallow(node)
    if (activeMessages.has(identity)) return
    activeMessages.add(identity)
    if (!normalizedMessages.has(identity)) {
      normalizedMessages.add(identity)
      beforeMessage?.(node)
    }
    schema(node.payload, [...path, 'payload'])
    trait(node, path)
    if (Array.isArray(node.traits))
      node.traits.forEach((child, index) => trait(child, [...path, 'traits', String(index)]))
    if (Array.isArray(node.oneOf))
      node.oneOf.forEach((child, index) => message(child, [...path, 'oneOf', String(index)]))
    activeMessages.delete(identity)
  }
  const channel = (value: unknown, path: string[]): void => {
    const node = getResolvedAsyncApiRef(value)
    if (!isObject(node)) return
    if (isObject(node.messages))
      for (const [name, child] of Object.entries(node.messages)) message(child, [...path, 'messages', name])
    for (const name of ['publish', 'subscribe']) {
      const operation = node[name]
      if (isObject(operation) && !('$ref' in operation)) message(operation.message, [...path, name, 'message'])
    }
  }
  const components = getResolvedAsyncApiRef(document.components) ?? {}
  if (isObject(components.schemas))
    for (const [name, node] of Object.entries(components.schemas)) schema(node, ['components', 'schemas', name])
  if (isObject(components.messages))
    for (const [name, node] of Object.entries(components.messages)) message(node, ['components', 'messages', name])
  if (isObject(components.messageTraits))
    for (const [name, node] of Object.entries(components.messageTraits))
      trait(node, ['components', 'messageTraits', name])
  if (isObject(components.channels))
    for (const [name, node] of Object.entries(components.channels)) channel(node, ['components', 'channels', name])
  if (isObject(document.channels))
    for (const [name, node] of Object.entries(document.channels)) channel(node, ['channels', name])
  return schemas
}
