import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { z } from 'zod'

export const SEARCH_OPENAPI_OPERATIONS_TOOL_NAME = 'search-openapi-operations' as const

export const searchOpenAPIOperationsInputSchema = z.object({
  question: z.string(),
})

export type SearchOpenAPIOperationsToolInput = z.input<typeof searchOpenAPIOperationsInputSchema>

export type SearchOpenAPIOperationsToolOutput = Partial<OpenAPIV3_1.Document>[]
