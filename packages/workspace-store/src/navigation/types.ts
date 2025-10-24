import type { IdGenerator, TraversedEntry } from '@/schemas/navigation'
import type { TagObject } from '@/schemas/v3.1/strict/openapi-document'

/** Map of tagNames and their entries */
export type TagsMap = Map<string, { id: string; parentId: string; tag: TagObject; entries: TraversedEntry[] }>

type OperationSortValue = {
  method: string
  path: string
  ref: string
  /** @deprecated use method instead */
  httpVerb: string
}

/** Configuration options for traversing an OpenAPI specification document.
 *
 * These options control how the document is processed and organized, including:
 * - Sorting of tags and operations
 * - Visibility of models
 * - ID generation for various elements (headings, operations, webhooks, models, tags)
 */
export type TraverseSpecOptions = {
  /** Controls how tags are sorted - either alphabetically or using a custom sort function */
  tagsSorter?: 'alpha' | ((a: TagObject, b: TagObject) => number)

  /** Controls how operations are sorted - alphabetically, by method, or using a custom sort function */
  operationsSorter?: 'alpha' | 'method' | ((a: OperationSortValue, b: OperationSortValue) => number)

  /** Whether to hide model schemas from the navigation */
  hideModels: boolean

  generateId: IdGenerator
}

export type Heading = { depth: number; value: string; slug?: string }
