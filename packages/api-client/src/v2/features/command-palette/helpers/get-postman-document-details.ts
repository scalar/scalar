import { isPostmanCollection } from '@/v2/features/command-palette/helpers/is-postman-collection'

/**
 * Represents the extracted details from a Postman collection.
 * Used to display collection metadata in the command palette import UI.
 */
type PostmanDocumentDetails = {
  /** The document format type. */
  type: string
  /** The name of the Postman collection. */
  title: string
  /** The version of the Postman collection. */
  version: string
  /** Postman collection schema segment from `info.schema` (e.g. `v2.1.0`), when present. */
  schemaLabel?: string
  /** The collection items. */
  collection: unknown[]
}

const extractSchemaLabel = (schema: unknown): string | undefined => {
  if (typeof schema !== 'string') {
    return undefined
  }
  const match = schema.match(/\/collection\/(v[\d.]+)\//i)
  return match?.[1]
}

/**
 * Extracts document details from a Postman collection JSON string.
 *
 * We parse and validate in a single pass to avoid the performance cost
 * of parsing the JSON twice.
 *
 * @param content - The JSON string representing the Postman collection
 * @returns The collection details if valid, null otherwise
 */
export const getPostmanDocumentDetails = (content: string): PostmanDocumentDetails | null => {
  if (!isPostmanCollection(content)) {
    return null
  }

  try {
    const parsed = JSON.parse(content)

    const schemaLabel = extractSchemaLabel(parsed.info?.schema)

    const collectionItems = Array.isArray(parsed.item) ? parsed.item : []

    return {
      type: 'json',
      title: parsed.info?.name || 'Postman Collection',
      version: parsed.info?.version || '1.0',
      schemaLabel: schemaLabel ?? undefined,
      collection: collectionItems,
    }
  } catch {
    return null
  }
}
