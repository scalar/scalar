/**
 * The result union used by client-executed tool outputs.
 *
 * Wire-compatible with the `neverpanic` package's `Result` type, which the
 * shipped clients use — defined structurally here so the protocol package
 * carries no runtime dependency for it.
 */
export type ToolResult<Data = unknown, ToolError = unknown> =
  | { success: true; data: Data }
  | { success: false; error: ToolError }

/**
 * A typed tool error: a literal code plus a code-specific detail payload.
 * Wire-compatible with `@scalar/agent-chat`'s `AgentChatError`.
 */
export type ToolError<Code extends string = string, Detail = unknown> = {
  code: Code
  detail: Detail
}
