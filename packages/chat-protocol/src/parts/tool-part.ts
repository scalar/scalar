/**
 * Structural model of the AI SDK UI message stream tool parts.
 *
 * This package is framework-free, so we do not import the `ai` package at
 * runtime. Instead we describe the shapes structurally — any `ToolUIPart` or
 * `DynamicToolUIPart` from the AI SDK satisfies these types. A type-level
 * compatibility test in `tool-part.test.ts` keeps us honest against the
 * installed AI SDK version.
 */

/**
 * The seven tool part states of the AI SDK UI message stream.
 *
 * The three approval states (`approval-requested`, `approval-responded`,
 * `output-denied`) only appear when the server declares `needsApproval` on a
 * tool. None of the Scalar chat endpoints do that yet — today approval is
 * decided client-side — but renderers must handle all seven states so the
 * server can adopt native approvals without a client release.
 */
export const TOOL_PART_STATES = [
  'input-streaming',
  'input-available',
  'approval-requested',
  'approval-responded',
  'output-available',
  'output-error',
  'output-denied',
] as const

export type ToolPartState = (typeof TOOL_PART_STATES)[number]

/** The approval object carried by the three native approval states. */
export type ToolPartApproval = {
  id: string
  approved?: boolean
  reason?: string
}

/** The part type used by the AI SDK for tools that are not statically known to the client. */
export const DYNAMIC_TOOL_PART_TYPE = 'dynamic-tool' as const

/**
 * Structural shape of a tool part in a UI message.
 *
 * Static tools have `type: 'tool-<name>'`; dynamic tools have
 * `type: 'dynamic-tool'` plus a `toolName` field.
 */
export type ToolPartLike = {
  type: string
  state: ToolPartState
  toolCallId: string
  toolName?: string
  input?: unknown
  output?: unknown
  errorText?: string
  approval?: ToolPartApproval
}

const STATIC_TOOL_PART_PREFIX = 'tool-'

/** Whether a message part is a tool part (static or dynamic). */
export const isToolPart = (part: { type?: unknown }): part is ToolPartLike =>
  typeof part.type === 'string' &&
  (part.type.startsWith(STATIC_TOOL_PART_PREFIX) || part.type === DYNAMIC_TOOL_PART_TYPE)

/** Whether a tool part belongs to a dynamic (not statically known) tool. */
export const isDynamicToolPart = (part: ToolPartLike): boolean => part.type === DYNAMIC_TOOL_PART_TYPE

/**
 * The tool name of a part: the `toolName` field for dynamic tools, the
 * `tool-` suffix for static ones.
 */
export const toolNameFromPart = (part: ToolPartLike): string => {
  if (part.type === DYNAMIC_TOOL_PART_TYPE) {
    return part.toolName ?? ''
  }

  return part.type.slice(STATIC_TOOL_PART_PREFIX.length)
}

/** The part type for a statically known tool name, e.g. `tool-execute-request`. */
export const toolPartType = (toolName: string): `tool-${string}` => `${STATIC_TOOL_PART_PREFIX}${toolName}`
