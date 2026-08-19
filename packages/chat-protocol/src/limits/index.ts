/**
 * Shared limits for the Scalar chat surfaces.
 *
 * These mirror the values enforced by `services/agent` and the client
 * executors today. Server and clients import them from here so the numbers
 * cannot drift apart.
 */

/** Maximum size of a single user message, in characters. Enforced server-side per message. */
export const MAX_PROMPT_SIZE = 10_000

/** Maximum size of a custom system prompt (MCP test chat), in characters. */
export const MAX_SYSTEM_PROMPT_LENGTH = 10_000

/** Maximum serialized size of a client-executed request response body, in bytes. Larger bodies are truncated. */
export const MAX_RESPONSE_SIZE = 50_000

/** Maximum open-file content sent as editor chat context, in characters. */
export const MAX_OPEN_FILE_CONTENT_SIZE = 30_000

/** Maximum scalar.config.json content sent as editor chat context, in characters. */
export const MAX_SCALAR_CONFIG_CONTENT_SIZE = 40_000

/** Maximum characters of a single documentation search chunk. */
export const MAX_SEARCH_CHUNK_SIZE = 12_000

/** Maximum total characters of documentation search context per call. */
export const MAX_SEARCH_TOTAL_CONTEXT_SIZE = 80_000
