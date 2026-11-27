import { HTTP_METHODS } from '@scalar/helpers/http/http-methods'
import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { isObject } from '@scalar/helpers/object/is-object'

import { resolveLocalReference } from '@/resolve-local-reference'
import type { ErrorObject, OpenApiVersion } from '@/types'

/** Checks server variable defaults where enum membership is required by OpenAPI 3.1 and 3.2. */
export const validateServerVariables = (document: Record<string, unknown>, version: OpenApiVersion): ErrorObject[] => {
  // OpenAPI 3.0 only recommends membership; OpenAPI 2.0 has no Server Objects.
  if (version !== '3.1' && version !== '3.2') {
    return []
  }
  const errors: ErrorObject[] = []
  const ancestors = new WeakSet<object>()
  const checkedServers = new WeakSet<object>()

  const checkServer = (server: unknown, path: string[]): void => {
    if (!isObject(server) || !isObject(server.variables) || checkedServers.has(server)) {
      return
    }
    checkedServers.add(server)
    for (const [name, variable] of Object.entries(server.variables)) {
      if (
        isObject(variable) &&
        Array.isArray(variable.enum) &&
        typeof variable.default === 'string' &&
        !variable.enum.includes(variable.default)
      ) {
        errors.push({
          path: `/${[...path, 'variables', name, 'default'].map(escapeJsonPointer).join('/')}`,
          message: `Server variable "${name}" default must be one of its enum values.`,
        })
      }
    }
  }

  const checkServers = (servers: unknown, path: string[]): void => {
    if (Array.isArray(servers)) {
      servers.forEach((server, index) => checkServer(server, [...path, String(index)]))
    }
  }

  const visitLink = (reference: unknown, path: string[]): void => {
    const link = resolveLocalReference(document, reference)
    if (link) {
      checkServer(link.server, [...path, 'server'])
    }
  }

  const visitResponse = (reference: unknown, path: string[]): void => {
    const response = resolveLocalReference(document, reference)
    if (response && isObject(response.links)) {
      for (const [name, link] of Object.entries(response.links)) {
        visitLink(link, [...path, 'links', name])
      }
    }
  }

  const visitCallback = (reference: unknown, path: string[]): void => {
    const callback = resolveLocalReference(document, reference)
    if (!callback || ancestors.has(callback)) {
      return
    }
    ancestors.add(callback)
    for (const [expression, item] of Object.entries(callback)) {
      if (!expression.startsWith('x-')) {
        visitPathItem(item, [...path, expression])
      }
    }
    ancestors.delete(callback)
  }

  const visitOperation = (operation: unknown, path: string[]): void => {
    if (!isObject(operation) || ancestors.has(operation)) {
      return
    }
    ancestors.add(operation)
    checkServers(operation.servers, [...path, 'servers'])
    if (isObject(operation.responses)) {
      for (const [status, response] of Object.entries(operation.responses)) {
        if (!status.startsWith('x-')) {
          visitResponse(response, [...path, 'responses', status])
        }
      }
    }
    if (isObject(operation.callbacks)) {
      for (const [name, callback] of Object.entries(operation.callbacks)) {
        visitCallback(callback, [...path, 'callbacks', name])
      }
    }
    ancestors.delete(operation)
  }

  const visitPathItem = (reference: unknown, path: string[]): void => {
    if (!isObject(reference) || ancestors.has(reference)) {
      return
    }
    const item = resolveLocalReference(document, reference, { preserveSiblings: true })
    if (!item) {
      return
    }
    ancestors.add(reference)
    checkServers(item.servers, [...path, 'servers'])
    for (const method of HTTP_METHODS) {
      if (method !== 'query' || version === '3.2') {
        visitOperation(item[method], [...path, method])
      }
    }
    if (version === '3.2' && isObject(item.additionalOperations)) {
      for (const [method, operation] of Object.entries(item.additionalOperations)) {
        visitOperation(operation, [...path, 'additionalOperations', method])
      }
    }
    ancestors.delete(reference)
  }

  checkServers(document.servers, ['servers'])
  for (const key of ['paths', 'webhooks']) {
    const items = document[key]
    if (isObject(items)) {
      for (const [name, item] of Object.entries(items)) {
        if (key !== 'paths' || name.startsWith('/')) {
          visitPathItem(item, [key, name])
        }
      }
    }
  }
  const components = document.components
  if (isObject(components)) {
    for (const [key, visit] of [
      ['pathItems', visitPathItem],
      ['callbacks', visitCallback],
      ['responses', visitResponse],
      ['links', visitLink],
    ] as const) {
      const items = components[key]
      if (isObject(items)) {
        for (const [name, item] of Object.entries(items)) {
          visit(item, ['components', key, name])
        }
      }
    }
  }
  return errors
}
