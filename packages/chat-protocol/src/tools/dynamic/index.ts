import {
  type ToolPartLike,
  type ToolPartState,
  isDynamicToolPart,
  isToolPart,
  toolNameFromPart,
} from '../../parts/tool-part'

/**
 * The dynamic-tool model.
 *
 * MCP installations expose curated per-operation tools whose names and input
 * shapes are generated from the user's OpenAPI documents — a client can never
 * know them statically. The fallback tool card that renders these is a
 * primary component of the unified kit, not a safety net.
 */

/** What a renderer needs to display a tool call it has no static schema for. */
export type DynamicToolDescription = {
  name: string
  state: ToolPartState
  input: unknown
  output: unknown
  errorText: string | undefined
}

/**
 * Describe any tool part for fallback rendering. Works for both dynamic
 * parts and statically named tools the current surface has no renderer for.
 */
export const describeDynamicTool = (part: ToolPartLike): DynamicToolDescription => ({
  name: toolNameFromPart(part),
  state: part.state,
  input: part.input,
  output: part.output,
  errorText: part.errorText,
})

export { isDynamicToolPart, isToolPart }
