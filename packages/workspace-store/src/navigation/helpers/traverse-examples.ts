import { getResolvedRef } from "@/helpers/get-resolved-ref";
import type { OperationObject } from "@/schemas/v3.1/strict/openapi-document";

/**
 * Traverse the OpenAPI operation object and extract all example values.
 * 
 * @param operation - The OpenAPI operation object to extract examples from
 */
export const traverseOperationExamples = (operation: OperationObject) => {
  const examples = new Set<string>();

  // Add all examples from request bodies
  if (operation.requestBody) {
    const requestBody = getResolvedRef(operation.requestBody);

    Object.values(requestBody.content).forEach((mediaType) => {
      Object.keys(mediaType.examples ?? {}).forEach(examples.add)
    })
  }

  // Add all examples from parameters
  if (operation.parameters) {
    operation.parameters.forEach((_parameter) => {
      const parameter = getResolvedRef(_parameter);

      if ('content' in parameter && parameter.content) {
        Object.values(parameter.content).forEach((mediaType) => {
          Object.keys(mediaType.examples ?? {}).forEach(examples.add)
        })
      }

      if ('examples' in parameter && parameter.examples) {
        Object.keys(parameter.examples).forEach(examples.add)
      }
    })
  }

  // Add all examples from responses
  if (operation.responses) {
    Object.values(operation.responses).forEach((response) => {
      const resolvedResponse = getResolvedRef(response);

      if ('content' in resolvedResponse && resolvedResponse.content) {
        Object.values(resolvedResponse.content).forEach((mediaType) => {
          Object.keys(mediaType.examples ?? {}).forEach(examples.add)
        })
      }

      // TODO: handle headers?
    })
  }

  return Array.from(examples);
}
