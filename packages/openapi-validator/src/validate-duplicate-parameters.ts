import { HTTP_METHODS } from '@scalar/helpers/http/http-methods'
import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { isObject } from '@scalar/helpers/object/is-object'

import { resolveLocalReference } from '@/resolve-local-reference'
import type { ErrorObject, OpenApiVersion } from '@/types'

/** Checks each parameter list independently so operation-level overrides remain valid. */
export const validateDuplicateParameters = (
  document: Record<string, unknown>,
  version: OpenApiVersion,
): ErrorObject[] => {
  const errors: ErrorObject[] = []
  const ancestors = new WeakSet<object>()
  const checkedLists = new WeakSet<object>()
  const methods = HTTP_METHODS.filter((method) =>
    method === 'query' ? version === '3.2' : method !== 'trace' || version !== '2.0',
  )

  const checkParameters = (parameters: unknown, path: string[]): void => {
    if (!Array.isArray(parameters) || checkedLists.has(parameters)) {
      return
    }
    checkedLists.add(parameters)
    const locations = new Map<string, Map<string, string>>()
    parameters.forEach((reference, index) => {
      const parameter = resolveLocalReference(document, reference)
      if (!parameter || typeof parameter.name !== 'string' || typeof parameter.in !== 'string') {
        return
      }
      const names = locations.get(parameter.in) ?? new Map<string, string>()
      locations.set(parameter.in, names)
      const pointer = `/${[...path, String(index)].map(escapeJsonPointer).join('/')}`
      const first = names.get(parameter.name)
      if (first !== undefined) {
        errors.push({
          path: pointer,
          message: `Duplicate parameter "${parameter.name}" in "${parameter.in}"; first declared at ${first}.`,
        })
      } else {
        names.set(parameter.name, pointer)
      }
    })
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
    checkParameters(operation.parameters, [...path, 'parameters'])
    if (version !== '2.0' && isObject(operation.callbacks)) {
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
    checkParameters(item.parameters, [...path, 'parameters'])
    for (const method of methods) {
      visitOperation(item[method], [...path, method])
    }
    if (version === '3.2' && isObject(item.additionalOperations)) {
      for (const [method, operation] of Object.entries(item.additionalOperations)) {
        visitOperation(operation, [...path, 'additionalOperations', method])
      }
    }
    ancestors.delete(reference)
  }

  for (const key of version === '3.1' || version === '3.2' ? ['paths', 'webhooks'] : ['paths']) {
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
  if (version !== '2.0' && isObject(components)) {
    if (isObject(components.callbacks)) {
      for (const [name, callback] of Object.entries(components.callbacks)) {
        visitCallback(callback, ['components', 'callbacks', name])
      }
    }
    if (version !== '3.0' && isObject(components.pathItems)) {
      for (const [name, item] of Object.entries(components.pathItems)) {
        visitPathItem(item, ['components', 'pathItems', name])
      }
    }
  }
  return errors
}
