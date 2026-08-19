import { z } from 'zod'

/**
 * The editor chat surface tools (`POST /editor/chat`).
 *
 * All nine are schema-only on the server (no `execute`) — the browser runs
 * them against the editor's virtual filesystem. `write_file` requires user
 * approval before it applies; `edit_file` applies immediately (see the
 * approval policy registry for the declared version of that behavior).
 */

export const READ_FILE_TOOL_NAME = 'read_file' as const

export const readFileInputSchema = z.object({
  path: z.string(),
  startLine: z.int().positive().optional(),
  endLine: z.int().positive().optional(),
})

export type ReadFileInput = z.infer<typeof readFileInputSchema>

export const LIST_FILES_TOOL_NAME = 'list_files' as const

export const listFilesInputSchema = z.object({
  path: z.string(),
  recursive: z.boolean().optional(),
  maxDepth: z.int().positive().optional(),
})

export type ListFilesInput = z.infer<typeof listFilesInputSchema>

export const GLOB_TOOL_NAME = 'glob' as const

export const globInputSchema = z.object({
  pattern: z.string(),
  path: z.string().optional(),
})

export type GlobInput = z.infer<typeof globInputSchema>

export const GREP_TOOL_NAME = 'grep' as const

export const grepInputSchema = z.object({
  pattern: z.string(),
  path: z.string().optional(),
  contextLines: z.int().min(0).max(5).optional(),
  caseSensitive: z.boolean().optional(),
})

export type GrepInput = z.infer<typeof grepInputSchema>

export const WRITE_FILE_TOOL_NAME = 'write_file' as const

export const writeFileInputSchema = z.object({
  path: z.string(),
  content: z.string(),
})

export type WriteFileInput = z.infer<typeof writeFileInputSchema>

export const EDIT_FILE_TOOL_NAME = 'edit_file' as const

export const editFileInputSchema = z.object({
  path: z.string(),
  oldString: z.string(),
  newString: z.string(),
  replaceAll: z.boolean().optional(),
})

export type EditFileInput = z.infer<typeof editFileInputSchema>

export const GET_CURRENT_FILE_TOOL_NAME = 'get_current_file' as const

export const getCurrentFileInputSchema = z.object({})

export type GetCurrentFileInput = z.infer<typeof getCurrentFileInputSchema>

export const VALIDATE_OPENAPI_TOOL_NAME = 'validate_openapi' as const

export const validateOpenApiInputSchema = z.object({
  path: z.string(),
})

export type ValidateOpenApiInput = z.infer<typeof validateOpenApiInputSchema>

export const SUMMARIZE_OPENAPI_TOOL_NAME = 'summarize_openapi' as const

export const summarizeOpenApiInputSchema = z.object({
  path: z.string(),
})

export type SummarizeOpenApiInput = z.infer<typeof summarizeOpenApiInputSchema>

/** Every editor surface tool name, for registries and exhaustiveness checks. */
export const EDITOR_TOOL_NAMES = [
  READ_FILE_TOOL_NAME,
  LIST_FILES_TOOL_NAME,
  GLOB_TOOL_NAME,
  GREP_TOOL_NAME,
  WRITE_FILE_TOOL_NAME,
  EDIT_FILE_TOOL_NAME,
  GET_CURRENT_FILE_TOOL_NAME,
  VALIDATE_OPENAPI_TOOL_NAME,
  SUMMARIZE_OPENAPI_TOOL_NAME,
] as const

export type EditorToolName = (typeof EDITOR_TOOL_NAMES)[number]

/** The editor tools that execute without user approval in the shipped client. */
export const EDITOR_AUTO_EXECUTED_TOOL_NAMES = [
  READ_FILE_TOOL_NAME,
  LIST_FILES_TOOL_NAME,
  GLOB_TOOL_NAME,
  GREP_TOOL_NAME,
  EDIT_FILE_TOOL_NAME,
  GET_CURRENT_FILE_TOOL_NAME,
  VALIDATE_OPENAPI_TOOL_NAME,
  SUMMARIZE_OPENAPI_TOOL_NAME,
] as const
