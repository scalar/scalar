import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Merges two OpenAPI OperationObject instances.
 * Assumes that all example names (keys in the 'examples' objects) are unique across both operations.
 * This assumption allows us to shallowly merge example maps without risk of overwriting.
 *
 * @example
 * const op1: OpenAPIV3_1.OperationObject = {
 *   tags: ['user'],
 *   parameters: [
 *     {
 *       name: 'id',
 *       in: 'path',
 *       required: true,
 *       schema: { type: 'string' },
 *       examples: { A: { value: 1 } }
 *     }
 *   ],
 *   requestBody: {
 *     content: {
 *       'application/json': {
 *         examples: { example1: { value: { foo: 'bar' } } }
 *       }
 *     }
 *   }
 * }
 *
 * const op2: OpenAPIV3_1.OperationObject = {
 *   tags: ['admin'],
 *   parameters: [
 *     {
 *       name: 'id',
 *       in: 'path',
 *       required: true,
 *       schema: { type: 'string' },
 *       examples: { B: { value: 2 } }
 *     }
 *   ],
 *   requestBody: {
 *     content: {
 *       'application/json': {
 *         examples: { example2: { value: { hello: 'world' } } }
 *       }
 *     }
 *   }
 * }
 *
 * const merged = mergeOperations(op1, op2)
 * // merged.tags -> ['user', 'admin']
 * // merged.parameters[0].examples -> { B: { value: 2 }, A: { value: 1 } }
 * // merged.requestBody.content['application/json'].examples ->
 * //    { example2: {...}, example1: {...} }
 */
export const mergeOperations = (
  operation1: OpenAPIV3_1.OperationObject,
  operation2: OpenAPIV3_1.OperationObject,
): OpenAPIV3_1.OperationObject => {
  const operation = { ...operation2 }

  // Merge tags (union, preserving uniqueness)
  if (operation1.tags || operation.tags) {
    operation.tags = Array.from(new Set([...(operation1.tags ?? []), ...(operation.tags ?? [])]))
  }

  const parameters = new Map<string, OpenAPIV3_1.ParameterObject>()

  const generateParameterId = (param: OpenAPIV3_1.ParameterObject) => `${param.name}/${param.in}`

  // Seed parameter list from operation2 (the base)
  if (operation.parameters) {
    for (const parameter of operation.parameters) {
      const id = generateParameterId(parameter)
      parameters.set(id, parameter)
    }
  }

  // Merge parameters from operation1 into parameters of operation2.
  // For each parameter, merge their 'examples' objects, assuming example keys are unique.
  if (operation1.parameters) {
    for (const parameter of operation1.parameters) {
      const id = generateParameterId(parameter)
      if (parameters.has(id)) {
        const existingParameter = parameters.get(id)
        if (existingParameter) {
          // Example keys are expected to be unique, so shallow merge is safe.
          existingParameter.examples = {
            ...existingParameter.examples,
            ...parameter.examples,
          }
        }
      } else {
        parameters.set(id, parameter)
      }
    }
  }

  if (parameters.size > 0) {
    operation.parameters = Array.from(parameters.values())
  }

  const contentMediaTypeMap = new Map<string, OpenAPIV3_1.MediaTypeObject>()

  // Seed requestBody content from operation2 (the base)
  if (operation.requestBody?.content) {
    for (const [contentType, mediaType] of Object.entries(operation.requestBody.content)) {
      contentMediaTypeMap.set(contentType, mediaType as OpenAPIV3_1.MediaTypeObject)
    }
  }

  // Merge requestBody content from operation1 into the base.
  // When merging 'examples', we expect example names to be unique (no overwrite).
  if (operation1.requestBody?.content) {
    for (const [contentType, mediaType] of Object.entries(operation1.requestBody.content)) {
      const mediaTypeObj = mediaType as OpenAPIV3_1.MediaTypeObject
      if (contentMediaTypeMap.has(contentType)) {
        const existingMediaType = contentMediaTypeMap.get(contentType)
        if (existingMediaType && (existingMediaType.examples || mediaTypeObj.examples)) {
          // Assumption: example names (keys) are unique, so this merge is safe
          existingMediaType.examples = {
            ...existingMediaType.examples,
            ...mediaTypeObj.examples,
          }
        }
      } else {
        contentMediaTypeMap.set(contentType, mediaTypeObj)
      }
    }
  }

  if (contentMediaTypeMap.size > 0) {
    operation.requestBody = {
      ...operation.requestBody,
      content: Object.fromEntries(contentMediaTypeMap) as OpenAPIV3_1.RequestBodyObject['content'],
    }
  }

  return operation
}
