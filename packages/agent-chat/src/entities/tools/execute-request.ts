import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

import type { AgentChatError } from '@/helpers'

export const EXECUTE_REQUEST_TOOL_NAME = 'execute-request' as const

export const executeRequestToolInputSchema = z.object({
  method: z.string(),
  path: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
})

export type ExecuteRequestToolInput = z.input<typeof executeRequestToolInputSchema>

export type ExecuteRequestToolOutput = CallToolResult & {
  structuredContent:
    | {
        success: false
        error: AgentChatError<
          'FAILED_TO_PARSE_RESPONSE_BODY',
          {
            originalError: unknown
          }
        >
      }
    | {
        success: false
        error: AgentChatError<
          'REQUEST_NOT_OK',
          {
            status: number
            url: string
            responseBody: string | undefined
            headers: Record<string, string>
          }
        >
        data?: undefined
      }
    | {
        success: true
        data: {
          status: number
          responseBody: string
          headers: Record<string, string>
        }
        error?: undefined
      }
    | {
        success: false
        error: AgentChatError<
          'FAILED_TO_FETCH',
          {
            originalError: unknown
          }
        >
      }
}
