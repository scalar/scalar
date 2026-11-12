import { HTTP_METHODS } from '@scalar/helpers/http/http-methods'
import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { isObject } from '@scalar/helpers/object/is-object'

import { resolveLocalReference } from '@/resolve-local-reference'
import type { ErrorObject, OpenApiVersion } from '@/types'

/** Checks operation ID uniqueness in active paths, webhooks and callbacks. */
export const validateOperationIds = (document: Record<string, unknown>, version: OpenApiVersion): ErrorObject[] => {
  const errors: ErrorObject[] = []
  const ids = new Map<string, string>()
  const ancestors = new WeakSet<object>()
  const methods = HTTP_METHODS.filter((method) =>
    method === 'query' ? version === '3.2' : method !== 'trace' || version !== '2.0',
  )

  const visitOperation = (operation: unknown, path: string[]): void => {
    if (!isObject(operation)) {
      return
    }
    if (typeof operation.operationId === 'string') {
      const pointer = `/${[...path, 'operationId'].map(escapeJsonPointer).join('/')}`
      const first = ids.get(operation.operationId)
      if (first !== undefined) {
        errors.push({
          path: pointer,
          message: `Duplicate operationId "${operation.operationId}"; first declared at ${first}.`,
        })
      } else {
        ids.set(operation.operationId, pointer)
      }
    }
    if (version !== '2.0' && isObject(operation.callbacks)) {
      for (const [name, reference] of Object.entries(operation.callbacks)) {
        const callback = resolveLocalReference(document, reference)
        if (!callback || ancestors.has(callback)) {
          continue
        }
        ancestors.add(callback)
        for (const [expression, item] of Object.entries(callback)) {
          if (!expression.startsWith('x-')) {
            visitPathItem(item, [...path, 'callbacks', name, expression])
          }
        }
        ancestors.delete(callback)
      }
    }
  }

  const visitPathItem = (reference: unknown, path: string[]): void => {
    const item = resolveLocalReference(document, reference)
    if (!item || ancestors.has(item)) {
      return
    }
    ancestors.add(item)
    for (const method of methods) {
      visitOperation(item[method], [...path, method])
    }
    if (version === '3.2' && isObject(item.additionalOperations)) {
      for (const [method, operation] of Object.entries(item.additionalOperations)) {
        visitOperation(operation, [...path, 'additionalOperations', method])
      }
    }
    ancestors.delete(item)
  }

  for (const key of version === '3.1' || version === '3.2' ? ['paths', 'webhooks'] : ['paths']) {
    const items = document[key]
    if (isObject(items)) {
      for (const [name, item] of Object.entries(items)) {
        // Webhook names are arbitrary map keys, including names beginning with x-.
        if (key !== 'paths' || name.startsWith('/')) {
          visitPathItem(item, [key, name])
        }
      }
    }
  }
  return errors
}
