import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { z } from 'zod'

export const GET_MINI_OPENAPI_SPEC_TOOL_NAME = 'get-mini-openapi-spec' as const

export const getMiniOpenAPIDocToolInputSchema = z.object({
  question: z.string(),
})

export type GetMiniOpenAPIDocToolInput = z.input<typeof getMiniOpenAPIDocToolInputSchema>

export type GetMiniOpenAPIDocToolOutput = CallToolResult & {
  structuredContent: Partial<OpenAPIV3_1.Document>
}
