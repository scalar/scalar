import { HTTP_METHODS } from '@scalar/helpers/http/http-methods'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { dereference } from './dereference'

/**
 * Collects all example names used on parameters and requestBodies
 * within all operations of a PathItemObject.
 *
 * This is useful for checking which example names are already present
 * so you can avoid clashes (e.g., generating unique example names
 * when merging path items).
 *
 * @param path - The OpenAPI PathItemObject to scan
 * @returns Set of all unique example names found across parameters and requestBodies
 *
 * @example
 * const operation: OpenAPIV3_1.OperationObject = {
 *   parameters: [
 *     {
 *       name: 'id',
 *       in: 'query',
 *       examples: {
 *         foo: { value: 'bar' },
 *         bar: { value: 'baz' }
 *       }
 *     }
 *   ],
 *   requestBody: {
 *     content: {
 *       'application/json': {
 *         examples: {
 *           default: { value: 1 },
 *           extra: { value: 2 }
 *         }
 *       }
 *     }
 *   }
 * }
 * const path = { get: operation }
 * // getOperationExamples(path) => Set { 'foo', 'bar', 'default', 'extra' }
 */
export const getOperationExamples = (path: OpenAPIV3_1.PathItemObject) => {
  const exampleNames = new Set<string>()

  for (const key of HTTP_METHODS) {
    const operation = path[key]
    if (operation === undefined || typeof operation !== 'object') {
      continue
    }

    const op = operation as OpenAPIV3_1.OperationObject

    if ('parameters' in op) {
      op.parameters?.forEach((rawParameter) => {
        const parameter = dereference(rawParameter)
        if (parameter && 'examples' in parameter && parameter.examples) {
          for (const exampleName of Object.keys(parameter.examples)) {
            exampleNames.add(exampleName)
          }
        }
      })
    }

    if ('requestBody' in op) {
      const requestBody = dereference(op.requestBody)
      if (requestBody?.content) {
        for (const mediaTypeObject of Object.values(requestBody.content)) {
          const examples =
            mediaTypeObject &&
            typeof mediaTypeObject === 'object' &&
            'examples' in mediaTypeObject &&
            typeof (mediaTypeObject as OpenAPIV3_1.MediaTypeObject).examples === 'object'
              ? (mediaTypeObject as OpenAPIV3_1.MediaTypeObject).examples
              : undefined
          if (examples) {
            for (const exampleName of Object.keys(examples)) {
              exampleNames.add(exampleName)
            }
          }
        }
      }
    }
  }

  return exampleNames
}
