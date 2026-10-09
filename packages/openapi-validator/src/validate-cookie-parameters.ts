import { getCookieSerializationError } from '@scalar/helpers/http/get-cookie-serialization-error'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { isObject } from '@scalar/helpers/object/is-object'
import type { AnyObject } from '@scalar/types/utils'

import type { ErrorObject } from '@/types'

/**
 * Checks cookie serialization declarations in OpenAPI 3.2 documents.
 * Resolve references before calling to also check referenced parameters and schemas.
 * Only OpenAPI parameter locations are visited; examples and extensions are data.
 */
export const validateCookieParameters = (specification: AnyObject): ErrorObject[] => {
  const [major, minor] = String(specification.openapi).split('.')
  if (major !== '3' || minor !== '2') {
    return []
  }
  const errors: ErrorObject[] = []
  const ancestors = new WeakSet<object>()

  const checkParameter = (parameter: unknown, path: string[]): void => {
    if (!isObject(parameter) || 'content' in parameter || typeof parameter.name !== 'string') {
      return
    }
    const message = getCookieSerializationError({
      name: parameter.name,
      in: String(parameter.in),
      style: typeof parameter.style === 'string' ? parameter.style : undefined,
      explode: typeof parameter.explode === 'boolean' ? parameter.explode : undefined,
      schema: parameter.schema,
    })
    if (message) {
      errors.push({ path: [...path, 'explode'], message })
    }
  }

  const checkParameters = (parameters: unknown, path: string[]): void => {
    if (Array.isArray(parameters)) {
      parameters.forEach((parameter, index) => checkParameter(parameter, [...path, String(index)]))
    }
  }

  const visitCallback = (callback: unknown, path: string[]): void => {
    if (!isObject(callback) || ancestors.has(callback)) {
      return
    }
    ancestors.add(callback)
    for (const [expression, pathItem] of Object.entries(callback)) {
      if (!expression.startsWith('x-') && expression !== '$ref') {
        visitPathItem(pathItem, [...path, expression])
      }
    }
    ancestors.delete(callback)
  }

  const visitOperation = (operation: unknown, path: string[]): void => {
    if (!isObject(operation)) {
      return
    }
    checkParameters(operation.parameters, [...path, 'parameters'])
    if (isObject(operation.callbacks)) {
      for (const [name, callback] of Object.entries(operation.callbacks)) {
        visitCallback(callback, [...path, 'callbacks', name])
      }
    }
  }

  const visitPathItem = (pathItem: unknown, path: string[]): void => {
    if (!isObject(pathItem) || ancestors.has(pathItem)) {
      return
    }
    ancestors.add(pathItem)
    checkParameters(pathItem.parameters, [...path, 'parameters'])
    for (const [method, operation] of Object.entries(pathItem)) {
      if (isHttpMethod(method)) {
        visitOperation(operation, [...path, method])
      }
    }
    if (isObject(pathItem.additionalOperations)) {
      for (const [method, operation] of Object.entries(pathItem.additionalOperations)) {
        visitOperation(operation, [...path, 'additionalOperations', method])
      }
    }
    ancestors.delete(pathItem)
  }

  for (const key of ['paths', 'webhooks']) {
    const items = specification[key]
    if (isObject(items)) {
      for (const [name, pathItem] of Object.entries(items)) {
        if (!name.startsWith('x-')) {
          visitPathItem(pathItem, [key, name])
        }
      }
    }
  }
  const components = specification.components
  if (isObject(components)) {
    for (const [key, visit] of [
      ['parameters', checkParameter],
      ['pathItems', visitPathItem],
      ['callbacks', visitCallback],
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
