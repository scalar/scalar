import { z } from 'zod'

/**
 * The editor chat surface tools (`POST /editor/chat`).
 *
 * All nine are schema-only on the server (no `execute`) — the browser runs
 * them against the editor's virtual filesystem. `write_file` requires user
 * approval before it applies; `edit_file` applies immediately (see the
 * approval policy registry for the declared version of that behavior).
 *
 * The tool descriptions and every field `.describe()` are part of the
 * model-visible JSON schema — they are behavior, not documentation, and are
 * ported verbatim from the server definitions.
 */

export const READ_FILE_TOOL_NAME = 'read_file' as const

export const readFileToolDescription =
  'Read a file from the in-browser docs filesystem. Optionally pass startLine/endLine (1-indexed, inclusive) to read a slice instead of the full file. Files larger than 120k characters return truncated content with isTruncated=true; re-call with a narrower line range to see more.'

export const readFileInputSchema = z.object({
  path: z.string().describe('Absolute file path inside the project, starting with /.'),
  startLine: z.int().positive().optional().describe('1-indexed first line to include.'),
  endLine: z.int().positive().optional().describe('1-indexed last line to include (inclusive).'),
})

export type ReadFileInput = z.infer<typeof readFileInputSchema>

export const LIST_FILES_TOOL_NAME = 'list_files' as const

export const listFilesToolDescription =
  'List entries inside a directory of the in-browser docs filesystem. Returns up to 500 entries; for deeper trees, set recursive=true and tune maxDepth, or call again on a sub-path. Prefer glob when you already know the file extension or naming pattern.'

export const listFilesInputSchema = z.object({
  path: z.string().describe('Absolute directory path inside the project, starting with /. Use / for the project root.'),
  recursive: z.boolean().optional().describe('Walk into subdirectories.'),
  maxDepth: z.int().positive().optional().describe('Cap recursion depth (only meaningful with recursive=true).'),
})

export type ListFilesInput = z.infer<typeof listFilesInputSchema>

export const GLOB_TOOL_NAME = 'glob' as const

export const globToolDescription =
  'Find files in the in-browser docs filesystem by glob pattern (e.g. **/*.mdx, docs/**/*.{json,yaml}). Returns up to 200 matches sorted by path. Cheaper than list_files when you know the naming pattern.'

export const globInputSchema = z.object({
  pattern: z
    .string()
    .describe('Standard glob pattern. Examples: **/*.mdx, openapi/**/*.yaml, docs/getting-started/**.'),
  path: z.string().optional().describe('Restrict the search to this subtree. Defaults to /.'),
})

export type GlobInput = z.infer<typeof globInputSchema>

export const GREP_TOOL_NAME = 'grep' as const

export const grepToolDescription =
  'Search file contents for a literal string (no regex). Walks files inside path (default /), skips binaries, returns up to 100 matches with surrounding context lines. Use this to locate a specific phrase, identifier, component name, or operation id.'

export const grepInputSchema = z.object({
  pattern: z.string().describe('Literal string to search for. No regex.'),
  path: z.string().optional().describe('Restrict the search to this subtree. Defaults to /.'),
  contextLines: z.int().min(0).max(5).optional().describe('Lines of surrounding context per match. Defaults to 1.'),
  caseSensitive: z.boolean().optional().describe('Match case exactly. Defaults to false.'),
})

export type GrepInput = z.infer<typeof grepInputSchema>

export const WRITE_FILE_TOOL_NAME = 'write_file' as const

export const writeFileToolDescription =
  'Create a new file or fully overwrite an existing file with the given content. The user must approve every write_file call before it applies. Prefer edit_file for surgical changes to existing files; use write_file for new files or near-total rewrites.'

export const writeFileInputSchema = z.object({
  path: z
    .string()
    .describe('Absolute file path inside the project, starting with /. Parent directories are created automatically.'),
  content: z.string().describe('Full content of the file after the write.'),
})

export type WriteFileInput = z.infer<typeof writeFileInputSchema>

export const EDIT_FILE_TOOL_NAME = 'edit_file' as const

export const editFileToolDescription =
  'Replace an exact substring in an existing file. oldString must match the file content exactly once (or set replaceAll=true). Matching tolerates differences in line endings, trailing whitespace, and indentation, so minor whitespace mismatches still apply. Edits apply immediately without user approval, so be deliberate; prefer this over write_file for any change to an existing file. For minified single-line files, provide oldString as a unique contiguous slice. On a no-match error, expand oldString with more surrounding lines and retry.'

export const editFileInputSchema = z.object({
  path: z.string().describe('Absolute file path inside the project.'),
  oldString: z
    .string()
    .describe('Exact substring to match. Include 3+ lines of surrounding context so the match is unique.'),
  newString: z.string().describe('Replacement content. Use an empty string to delete oldString.'),
  replaceAll: z.boolean().optional().describe('Replace every occurrence instead of requiring a unique match.'),
})

export type EditFileInput = z.infer<typeof editFileInputSchema>

export const GET_CURRENT_FILE_TOOL_NAME = 'get_current_file' as const

export const getCurrentFileToolDescription =
  'Return the file the user currently has open in the editor, including unsaved changes. Useful when the user says "this file" or "the current page" without naming a path.'

export const getCurrentFileInputSchema = z.object({})

export type GetCurrentFileInput = z.infer<typeof getCurrentFileInputSchema>

export const VALIDATE_OPENAPI_TOOL_NAME = 'validate_openapi' as const

export const validateOpenApiToolDescription =
  'Parse and validate an OpenAPI specification file (json or yaml) in the in-browser filesystem. Returns the spec version and a list of errors with line numbers when validation fails. Always call this after editing an OpenAPI file; fix errors and re-validate before stopping.'

export const validateOpenApiInputSchema = z.object({
  path: z.string().describe('Absolute path to a .json, .yaml, or .yml OpenAPI file.'),
})

export type ValidateOpenApiInput = z.infer<typeof validateOpenApiInputSchema>

export const SUMMARIZE_OPENAPI_TOOL_NAME = 'summarize_openapi' as const

export const summarizeOpenApiToolDescription =
  'Get a compact summary of an OpenAPI document in the in-browser filesystem. Returns version, info, server count, path list, operation count, and security schemes without dumping the full spec into context. Prefer this over read_file when a user asks broad questions about a spec, or when read_file truncates the content.'

export const summarizeOpenApiInputSchema = z.object({
  path: z.string().describe('Absolute path to a .json, .yaml, or .yml OpenAPI file.'),
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
