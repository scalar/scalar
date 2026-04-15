import type { Result } from 'neverpanic'
import { object, optional, record, string, type Static } from '@scalar/validation'

import type { AgentChatError } from '@/entities/error/constants'

export const EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME = 'execute-request' as const

export const executeClientSideRequestToolInputSchema = object({
  method: string(),
  path: string(),
  headers: optional(record(string(), string())),
  body: optional(string()),
  documentName: string(),
  documentIdentifier: string({ typeComment: 'Needed for legacy support for old clients' }),
})

export type ExecuteClientSideRequestToolInput = Static<typeof executeClientSideRequestToolInputSchema>

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
