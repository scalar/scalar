import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { isObject } from '@scalar/helpers/object/is-object'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'

const entries = (value: unknown): [string, unknown][] => (isObject(value) ? Object.entries(value) : [])
const label = (value: unknown, fallback: string): string => (typeof value === 'string' && value ? value : fallback)

/** Display native API identities without treating path metadata as operations. */
export const getSearchResultLabels = (input: unknown): string[] => {
  if (!isObject(input)) {
    return []
  }
  const document = createMagicProxy(input)
  const title = isObject(document.info) ? label(document.info.title, '') : ''
  const prefix = title ? `${title} - ` : ''
  if (typeof document.asyncapi === 'string') {
    const operations = entries(document.operations).flatMap(([name, node]) => {
      const operation = getResolvedAsyncApiRef(node)
      if (!isObject(operation)) {
        return []
      }
      const channel = getResolvedAsyncApiRef(operation.channel)
      const address = isObject(channel) ? label(channel.address, 'Unknown address') : 'Unknown address'
      return [
        `${prefix}${label(operation.action, 'Operation')} ${address}: ${label(operation.title, label(operation.summary, name))}`,
      ]
    })
    const channels = entries(document.channels).flatMap(([name, node]) => {
      const channel = getResolvedAsyncApiRef(node)
      if (!isObject(channel)) {
        return []
      }
      const address = label(channel.address, 'Unknown address')
      return [
        `${prefix}Channel ${address}: ${label(channel.title, name)}`,
        ...entries(channel.messages).map(([messageName, node]) => {
          const message = getResolvedAsyncApiRef(node)
          return `${prefix}Message ${isObject(message) ? label(message.title, label(message.name, messageName)) : messageName} (${address})`
        }),
      ]
    })
    return [...operations, ...channels]
  }
  return entries(document.paths).flatMap(([path, node]) =>
    entries(node).flatMap(([method, operation]) =>
      isHttpMethod(method) && isObject(operation)
        ? [`${prefix}${label(operation.summary, `${method.toUpperCase()} ${path}`)}`]
        : [],
    ),
  )
}
