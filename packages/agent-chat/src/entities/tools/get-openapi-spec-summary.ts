import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

export const GET_OPENAPI_SPECS_SUMMARY_TOOL_NAME = 'get-openapi-specs-summary' as const

export type GetOpenAPISpecsSummaryToolOutput = CallToolResult & {
  structuredContent: {
    info?: OpenAPIV3_1.InfoObject
    paths: string[]
  }
}
