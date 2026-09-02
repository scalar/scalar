import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { OperationObject } from '@/schemas/v3.1/strict/openapi-document'

/**
 * Traverse the OpenAPI operation object and extract all example values.
 *
 * @param operation - The OpenAPI operation object to extract examples from
 */
export const traverseOperationExamples = (operation: OperationObject) => {
  // Add all examples from draft examples
  const examples = new Set<string>(operation['x-draft-examples'] ?? [])

  // Add all examples from request bodies
  if (operation.requestBody) {
    const requestBody = getResolvedRef(operation.requestBody)

    Object.values(requestBody.content ?? {}).forEach((mediaType) => {
      Object.keys(mediaType.examples ?? {}).forEach((key) => {
        examples.add(key)
      })
    })
  }

  // Add all examples from parameters
  if (operation.parameters) {
    operation.parameters.forEach((_parameter) => {
      const parameter = getResolvedRef(_parameter) ?? {}

      if ('content' in parameter && parameter.content) {
        Object.values(parameter.content).forEach((mediaType) => {
          Object.keys(mediaType.examples ?? {}).forEach((key) => {
            examples.add(key)
          })
        })
      }

      if ('examples' in parameter && parameter.examples) {
        Object.keys(parameter.examples ?? {}).forEach((key) => {
          examples.add(key)
        })
      }
    })
  }

  return Array.from(examples)
}

/**
 * Build an example key that does not collide with any example the operation already has.
 *
 * Draft examples are stored in a `Set`, so reusing an existing key silently no-ops instead of
 * creating a new entry. Callers that generate examples on the user's behalf (rather than asking
 * for a name) use this to keep every click producing a fresh example.
 *
 * The base name is returned untouched when it is still free, otherwise a numeric suffix is added:
 * `Generated`, `Generated (2)`, `Generated (3)`, ...
 */
export const getUniqueExampleName = (operation: OperationObject, baseName: string): string => {
  const taken = new Set(traverseOperationExamples(operation))

  if (!taken.has(baseName)) {
    return baseName
  }

  let suffix = 2
  while (taken.has(`${baseName} (${suffix})`)) {
    suffix++
  }

  return `${baseName} (${suffix})`
}
