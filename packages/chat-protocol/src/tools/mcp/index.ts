import { z } from 'zod'

/**
 * The MCP surface tools: the tools an installation's MCP server exposes, as
 * seen by the MCP test chat (`POST /mcp/installations/{id}/chat`) and the docs
 * chat, which consumes `search-documentation` through an MCP loopback.
 *
 * Beyond these named tools, MCP installations expose curated per-operation
 * tools with generated names and per-operation input shapes — those can never
 * be a static map. See `tools/dynamic` for the model that covers them.
 */

/** Server-executed: search the project documentation. */
export const SEARCH_DOCUMENTATION_TOOL_NAME = 'search-documentation' as const

export const searchDocumentationInputSchema = z.object({
  question: z.string().default(''),
})

export type SearchDocumentationInput = z.infer<typeof searchDocumentationInputSchema>

/** A documentation search hit. */
export type SearchDocumentationSource = {
  title: string
  url: string
  pageContent: string
  metadata?: Record<string, unknown>
}

export type SearchDocumentationOutput = {
  content: SearchDocumentationSource[]
}

/**
 * Server-executed: run an HTTP request from the MCP server.
 *
 * Shares its wire name with the OpenAPI surface's client-executed
 * `execute-request` but has a different, richer schema and runs server-side —
 * the documented name collision. Each surface registers its own renderer.
 */
export const MCP_EXECUTE_REQUEST_TOOL_NAME = 'execute-request' as const

export const mcpExecuteRequestInputSchema = z.object({
  xScalarDocumentId: z.string(),
  xScalarOperationId: z.string(),
  method: z.string(),
  serverBaseUrl: z.url().describe("Must be one of the document's declared server URLs"),
  path: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
})

export type McpExecuteRequestInput = z.infer<typeof mcpExecuteRequestInputSchema>

/**
 * Marker set by the server when a response body was truncated to fit the
 * response size limit (`_meta['scalar/truncated']` on MCP outputs).
 */
export const MCP_TRUNCATED_META_KEY = 'scalar/truncated' as const
