import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

import { getResolvedAsyncApiRef } from '../get-resolved-async-api-ref'
import { unpackProxyShallow } from '../unpack-proxy'

/** Visit schema positions, including resolved aliases, without treating examples or extensions as schemas. */
export const getInlineAsyncApiSchemaWrappers = (
  document: AsyncApiDocument,
  beforeMessage?: (message: Record<string, unknown>) => void,
): Record<string, unknown>[] => {
  const schemas: Record<string, unknown>[] = []
  const schema = (value: unknown): void => {
    const node = getResolvedAsyncApiRef(value)
    if (isObject(node) && typeof node.schemaFormat === 'string') schemas.push(node)
  }
  const trait = (value: unknown): void => {
    const node = getResolvedAsyncApiRef(value)
    if (isObject(node)) schema(node.headers)
  }
  const messages = new WeakSet<object>()
  const message = (value: unknown): void => {
    const node = getResolvedAsyncApiRef(value)
    if (!isObject(node) || messages.has(unpackProxyShallow(node))) return
    messages.add(unpackProxyShallow(node))
    beforeMessage?.(node)
    schema(node.payload)
    trait(node)
    if (Array.isArray(node.traits)) for (const child of node.traits) trait(child)
    if (Array.isArray(node.oneOf)) for (const child of node.oneOf) message(child)
  }
  const channel = (value: unknown): void => {
    const node = getResolvedAsyncApiRef(value)
    if (!isObject(node)) return
    if (isObject(node.messages)) for (const child of Object.values(node.messages)) message(child)
    for (const operation of [node.publish, node.subscribe]) {
      if (isObject(operation) && !('$ref' in operation)) message(operation.message)
    }
  }
  const components = getResolvedAsyncApiRef(document.components) ?? {}
  if (isObject(components.schemas)) for (const node of Object.values(components.schemas)) schema(node)
  if (isObject(components.messages)) for (const node of Object.values(components.messages)) message(node)
  if (isObject(components.messageTraits)) for (const node of Object.values(components.messageTraits)) trait(node)
  if (isObject(components.channels)) for (const node of Object.values(components.channels)) channel(node)
  if (isObject(document.channels)) for (const node of Object.values(document.channels)) channel(node)
  return schemas
}
