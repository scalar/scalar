import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { TraverseSpecOptions } from '@/navigation/types'
import type { TraversedEntryBodyParameter } from '@/schemas/navigation'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'

/**
 * Traverses the request body of an OpenAPI operation, extracting top-level property fields
 * from supported media types (e.g., application/json, application/x-www-form-urlencoded) that define object schemas.
 * Only considers schemas of type "object" and returns body parameter navigation entries for each property.
 *
 * @param operation - The OpenAPI operation object to traverse.
 * @param generateId - Function to generate a unique ID for each property.
 * @param parentId - The parent navigation entry ID.
 * @returns An array of TraversedEntryBodyParameter objects representing the extracted body properties.
 */
export const traverseOperationBody = ({
  operation,
  generateId,
  parentId,
}: {
  operation: OperationObject
  generateId: TraverseSpecOptions['generateId']
  parentId: string
}) => {
  const result: TraversedEntryBodyParameter[] = []

  // Resolve the request body, handling $ref if present
  const requestBody = getResolvedRef(operation.requestBody)

  // Iterate over each media type in the requestBody's content
  Object.entries(requestBody?.content ?? {}).forEach(([mediaType, mediaTypeObject]) => {
    // Resolve the schema for this media type, handling $ref if present
    const schema = getResolvedRef(mediaTypeObject.schema)

    // Only extract properties if the schema is an object with defined properties
    if (schema && 'type' in schema && schema.type === 'object') {
      const properties = Object.keys(schema.properties ?? {})

      properties.forEach((propertyName) => {
        result.push({
          type: 'body',
          id: generateId({
            type: 'body',
            mediaType,
            name: propertyName,
            parentId,
            schema,
          }),
          name: propertyName,
          title: propertyName,
        })
      })
    }
  })

  return result
}
