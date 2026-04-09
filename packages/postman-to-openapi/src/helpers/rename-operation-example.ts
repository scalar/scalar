import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Renames an example in all parameters and requestBody content of an operation object.
 *
 * This will copy the example (by name) and remove the old entry both for parameter examples
 * and within every media type of the requestBody, if such examples exist.
 *
 * @param operation - The OpenAPI operation object to mutate
 * @param exampleName - The existing example name to rename
 * @param newExampleName - The new name to give that example
 *
 * @example
 * // Given:
 * const operation = {
 *   parameters: [
 *     {
 *       name: 'foo',
 *       in: 'query',
 *       examples: {
 *         oldName: { value: 'fooValue' }
 *       }
 *     }
 *   ],
 *   requestBody: {
 *     content: {
 *       'application/json': {
 *         examples: {
 *           oldName: { value: 123 }
 *         }
 *       }
 *     }
 *   }
 * }
 * renameOperationExamples(operation, 'oldName', 'newName')
 * // After:
 * // operation.parameters[0].examples: { newName: { value: 'fooValue' } }
 * // operation.requestBody.content['application/json'].examples: { newName: { value: 123 } }
 */
export const renameOperationExamples = (
  operation: OpenAPIV3_1.OperationObject,
  exampleName: string,
  newExampleName: string,
): void => {
  // Rename in parameter examples (if present)
  if ('parameters' in operation) {
    operation.parameters?.forEach((parameter) => {
      if (parameter.examples?.[exampleName] && exampleName !== newExampleName) {
        parameter.examples[newExampleName] = parameter.examples[exampleName]
        delete parameter.examples[exampleName]
      }
    })
  }

  // Rename in requestBody content examples (if present)
  if ('requestBody' in operation) {
    Object.values(operation.requestBody?.content ?? {}).forEach((mediaTypeObject) => {
      if (
        (mediaTypeObject as OpenAPIV3_1.MediaTypeObject).examples &&
        typeof (mediaTypeObject as OpenAPIV3_1.MediaTypeObject).examples === 'object'
      ) {
        const mediaCasted = mediaTypeObject as OpenAPIV3_1.MediaTypeObject
        if (mediaCasted.examples?.[exampleName] && exampleName !== newExampleName) {
          mediaCasted.examples[newExampleName] = mediaCasted.examples[exampleName]
          delete mediaCasted.examples[exampleName]
        }
      }
    })
  }
}
