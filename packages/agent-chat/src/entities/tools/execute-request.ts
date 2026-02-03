import type { Result } from 'neverpanic'
import { z } from 'zod'

import type { AgentChatError } from '@/entities/error/constants'

export const EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME = 'execute-request' as const

export const executeClientSideRequestToolInputSchema = z.object({
  method: z.string(),
  path: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  documentIdentifier: z.string(),
})

export type ExecuteClientSideRequestToolInput = z.input<typeof executeClientSideRequestToolInputSchema>

export type ExecuteClientSideRequestToolOutput = Result<
  { status: number; responseBody?: unknown; headers: {} },
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
        responseBody: unknown
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
  | AgentChatError<'FAILED_TO_DETERMINE_DOCUMENT', { namespace?: string; slug?: string; documentIdentifier: string }>
  | AgentChatError<'FAILED_TO_EXECUTE_REQUEST', unknown>
>
