import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { object, string, type Static } from '@scalar/validation'

export const SEARCH_OPENAPI_OPERATIONS_TOOL_NAME = 'search-openapi-operations' as const

export const searchOpenAPIOperationsInputSchema = object({
  question: string(),
})

export type SearchOpenAPIOperationsToolInput = Static<typeof searchOpenAPIOperationsInputSchema>

export type SearchOpenAPIOperationsToolOutput = Partial<OpenAPIV3_1.Document>[]
