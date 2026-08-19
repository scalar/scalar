/**
 * Declarative per-tool approval policy.
 *
 * Until the chat servers adopt the AI SDK's native `needsApproval`, whether a
 * client-executed tool call needs user approval is decided client-side. Each
 * surface used to hardcode its own heuristic (`method !== 'get'` in
 * agent-chat, a `write_file` allowlist in the editor). This registry replaces
 * those heuristics with declared policy, per the unification plan.
 */

import {
  EDIT_FILE_TOOL_NAME,
  GET_CURRENT_FILE_TOOL_NAME,
  GLOB_TOOL_NAME,
  GREP_TOOL_NAME,
  LIST_FILES_TOOL_NAME,
  READ_FILE_TOOL_NAME,
  SUMMARIZE_OPENAPI_TOOL_NAME,
  VALIDATE_OPENAPI_TOOL_NAME,
  WRITE_FILE_TOOL_NAME,
} from '../tools/editor'
import { EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME } from '../tools/openapi'

/** What should happen when a client-executed tool call arrives. */
export type ApprovalDecision = 'auto' | 'approval'

/** A static decision, or one computed from the tool input. */
export type ApprovalPolicy<Input = unknown> = ApprovalDecision | ((input: Input) => ApprovalDecision)

/** Per-tool policies, keyed by tool name. */
export type ApprovalPolicyRegistry = Record<string, ApprovalPolicy>

/**
 * Resolve the decision for one tool call.
 *
 * Unregistered tools default to `approval`: a client executor that is not in
 * the registry should never run silently.
 */
export const resolveApprovalDecision = (
  registry: ApprovalPolicyRegistry,
  toolName: string,
  input: unknown,
  defaultDecision: ApprovalDecision = 'approval',
): ApprovalDecision => {
  // Own-property lookup only: tool names come off the wire (dynamic MCP
  // tools are generated from user OpenAPI documents), so a name like
  // `hasOwnProperty` or `toString` must hit the default, not the prototype.
  const policy = Object.hasOwn(registry, toolName) ? registry[toolName] : undefined

  if (policy === undefined) {
    return defaultDecision
  }

  if (typeof policy === 'function') {
    return policy(input)
  }

  return policy
}

const isGetRequest = (input: unknown): boolean =>
  typeof input === 'object' &&
  input !== null &&
  'method' in input &&
  typeof (input as { method: unknown }).method === 'string' &&
  (input as { method: string }).method.toLowerCase() === 'get'

/**
 * The OpenAPI surface policy shipped today: GET requests execute
 * automatically, everything else asks first.
 */
export const openApiApprovalPolicies: ApprovalPolicyRegistry = {
  [EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME]: (input) => (isGetRequest(input) ? 'auto' : 'approval'),
}

/**
 * The editor surface policy shipped today: `write_file` asks first, all other
 * tools — including `edit_file` — execute automatically. Flipping `edit_file`
 * to approval is a product decision (a "Review each edit" session toggle),
 * not part of the infrastructure migration.
 */
export const editorApprovalPolicies: ApprovalPolicyRegistry = {
  [READ_FILE_TOOL_NAME]: 'auto',
  [LIST_FILES_TOOL_NAME]: 'auto',
  [GLOB_TOOL_NAME]: 'auto',
  [GREP_TOOL_NAME]: 'auto',
  [GET_CURRENT_FILE_TOOL_NAME]: 'auto',
  [VALIDATE_OPENAPI_TOOL_NAME]: 'auto',
  [SUMMARIZE_OPENAPI_TOOL_NAME]: 'auto',
  [EDIT_FILE_TOOL_NAME]: 'auto',
  [WRITE_FILE_TOOL_NAME]: 'approval',
}
