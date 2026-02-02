import type { Result } from 'neverpanic'
import { z } from 'zod'

import type { AgentChatError } from '@/entities/error/constants'

export const EXECUTE_REQUEST_TOOL_NAME = 'execute-request' as const

export const executeRequestToolInputSchema = z.object({
  method: z.string(),
  path: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  namespace: z.string(),
  slug: z.string(),
})

export type ExecuteRequestToolInput = z.input<typeof executeRequestToolInputSchema>

export type ExecuteRequestToolOutput = Result<
  { status: number; responseBody?: string; headers: {} },
  | AgentChatError<
      'FAILED_TO_PARSE_RESPONSE_BODY',
      {
        originalError: unknown
      }
    >
  | AgentChatError<
      'REQUEST_NOT_OK',
      {
        status: number
        url: string
        responseBody: string | undefined
        headers: Record<string, string>
      }
    >
  | AgentChatError<
      'FAILED_TO_FETCH',
      {
        originalError: unknown
      }
    >
  | AgentChatError<
      'DOCUMENT_SETTINGS_COULD_NOT_BE_DETERMINED',
      {
        documentName: string
        namespace: string
        slug: string
      }
    >
  | AgentChatError<'FAILED_TO_EXECUTE_REQUEST', unknown>
>
