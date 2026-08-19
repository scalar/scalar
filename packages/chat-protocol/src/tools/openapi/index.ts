import { z } from 'zod'

import type { ToolError, ToolResult } from '../../result'

/**
 * The OpenAPI chat surface tools (`POST /openapi/chat`).
 *
 * These schemas are the single source of truth shared by the server tool
 * definitions and the client renderers. They were previously hand-mirrored
 * between `services/agent` (zod) and `@scalar/agent-chat/entities`
 * (`@scalar/validation`) — including the legacy-support comment, which existed
 * once as `.describe()` and once as `typeComment`.
 */

/** Server-executed: summarize the loaded OpenAPI documents. */
export const SUMMARIZE_OPENAPI_SPECS_TOOL_NAME = 'summarize-openapi-specs' as const

export const summarizeOpenApiSpecsInputSchema = z.object({})

export type SummarizeOpenApiSpecsInput = z.infer<typeof summarizeOpenApiSpecsInputSchema>

/**
 * The summary returned per document. Structural subset of OpenAPI 3.1 —
 * consumers that need full OpenAPI types can narrow with
 * `@scalar/openapi-types`.
 */
export type SummarizeOpenApiSpecsOutput = {
  paths: string[]
  components?: {
    securitySchemes: Record<string, unknown>
  }
  info?: Record<string, unknown>
  externalDocs?: unknown
  servers?: unknown[]
}[]

/** Server-executed: semantic search over the loaded OpenAPI documents. */
export const SEARCH_OPENAPI_OPERATIONS_TOOL_NAME = 'search-openapi-operations' as const

export const searchOpenApiOperationsInputSchema = z.object({
  question: z.string(),
})

export type SearchOpenApiOperationsInput = z.infer<typeof searchOpenApiOperationsInputSchema>

/** Partial OpenAPI documents containing the matched operations. */
export type SearchOpenApiOperationsOutput = Record<string, unknown>[]

/** Client-executed: ask the user to authenticate against a document. */
export const ASK_FOR_AUTHENTICATION_TOOL_NAME = 'ask-for-authentication' as const

export const askForAuthenticationInputSchema = z.object({
  documentName: z.string(),
  uniqueIdentifier: z.string().describe('Needed for legacy support for old clients'),
})

export type AskForAuthenticationInput = z.infer<typeof askForAuthenticationInputSchema>

/**
 * Client-executed: run an HTTP request against the user's API.
 *
 * Note the name collision documented in the unification plan: the MCP surface
 * has a server-executed tool with the same wire name but a different, richer
 * schema (see `tools/mcp`). Each surface registers its own renderer; nothing
 * shared may branch on input shape.
 */
export const EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME = 'execute-request' as const

export const executeClientSideRequestInputSchema = z.object({
  method: z.string(),
  path: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  documentName: z.string(),
  documentIdentifier: z.string().describe('Needed for legacy support for old clients'),
})

export type ExecuteClientSideRequestInput = z.infer<typeof executeClientSideRequestInputSchema>

export type ExecuteClientSideRequestOutput = ToolResult<
  { status: number; responseBody?: unknown; headers: Record<string, string> },
  | ToolError<'FAILED_TO_PARSE_RESPONSE_BODY', { originalError: unknown }>
  | ToolError<'REQUEST_NOT_OK', { status: number; url: string; responseBody: unknown; headers: Record<string, string> }>
  | ToolError<'FAILED_TO_FETCH', { originalError: unknown }>
  | ToolError<
      'DOCUMENT_SETTINGS_COULD_NOT_BE_DETERMINED',
      /** Older clients sent namespace/slug; the shipped client sends only documentName. Both encodings persist forever. */
      { documentName: string; namespace?: string; slug?: string }
    >
  | ToolError<'FAILED_TO_DETERMINE_DOCUMENT', { namespace?: string; slug?: string; documentIdentifier: string }>
  | ToolError<'FAILED_TO_EXECUTE_REQUEST', unknown>
>

/** Every OpenAPI surface tool name, for registries and exhaustiveness checks. */
export const OPENAPI_TOOL_NAMES = [
  SUMMARIZE_OPENAPI_SPECS_TOOL_NAME,
  SEARCH_OPENAPI_OPERATIONS_TOOL_NAME,
  ASK_FOR_AUTHENTICATION_TOOL_NAME,
  EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME,
] as const

export type OpenApiToolName = (typeof OPENAPI_TOOL_NAMES)[number]
