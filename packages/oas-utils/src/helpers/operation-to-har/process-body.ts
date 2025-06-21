import type { OperationToHarProps } from '@/helpers/operation-to-har/operation-to-har'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'
import { isReference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import type { PostData } from 'har-format'

type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'operation' | 'example'>

/**
 * Extended SchemaObject type that includes the examples property from JSON Schema
 */
type ExtendedSchemaObject = SchemaObject & {
  examples?: unknown[]
}

/**
 * Recursively extracts examples from a schema object and its nested properties
 * @param schema - The schema object to extract examples from
 * @param depth - Current recursion depth to prevent infinite loops
 * @returns The extracted example or undefined if none found
 */
const extractExamplesFromSchema = (schema: ExtendedSchemaObject | undefined, depth = 0): unknown => {
  // Prevent infinite recursion and handle invalid inputs
  if (!schema || depth > 10) {
    return undefined
  }

  // If the schema has examples array, return the first one
  if (schema.examples?.[0] !== undefined) {
    return schema.examples[0]
  }

  // If the schema has a single example property, return it
  if (schema.example !== undefined) {
    return schema.example
  }

  // For objects, recursively process properties
  if (schema.type === 'object' && schema.properties) {
    const result: Record<string, unknown> = {}
    let hasExamples = false

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const example = extractExamplesFromSchema(propSchema as ExtendedSchemaObject, depth + 1)
      if (example !== undefined) {
        result[key] = example
        hasExamples = true
      }
    }

    return hasExamples ? result : undefined
  }

  // For arrays, process the items schema
  if (schema.type === 'array' && schema.items) {
    const itemExample = extractExamplesFromSchema(schema.items as ExtendedSchemaObject, depth + 1)
    return itemExample !== undefined ? [itemExample] : undefined
  }

  return undefined
}

/**
 * Processes the request body and returns the processed data
 */
export const processBody = ({ operation, contentType, example }: ProcessBodyProps): PostData => {
  const content = !operation.requestBody || isReference(operation.requestBody) ? {} : operation.requestBody.content
  const _contentType = contentType || Object.keys(content)[0]

  // Return the provided top level example
  if (example) {
    return {
      mimeType: _contentType,
      text: JSON.stringify(example),
    }
  }

  // Try to extract examples from the schema
  const contentSchema = content[_contentType]?.schema
  if (contentSchema) {
    const extractedExample = extractExamplesFromSchema(contentSchema as ExtendedSchemaObject)
    if (extractedExample !== undefined) {
      return {
        mimeType: _contentType,
        text: JSON.stringify(extractedExample),
      }
    }
  }

  return {
    mimeType: _contentType,
    text: 'null',
  }
}
