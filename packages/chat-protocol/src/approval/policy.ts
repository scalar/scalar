/**
 * Declarative per-tool approval policy.
 *
 * Until the chat servers adopt the AI SDK's native `needsApproval`, whether a
 * client-executed tool call needs user approval is decided client-side. Each
 * surface used to hardcode its own heuristic (`method !== 'get'` in
 * agent-chat, a `write_file` allowlist in the editor). This registry replaces
 * those heuristics with declared policy, per the unification plan.
 */

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
  const policy = registry[toolName]

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
  'execute-request': (input) => (isGetRequest(input) ? 'auto' : 'approval'),
}

/**
 * The editor surface policy shipped today: `write_file` asks first, all other
 * tools — including `edit_file` — execute automatically. Flipping `edit_file`
 * to approval is a product decision (a "Review each edit" session toggle),
 * not part of the infrastructure migration.
 */
export const editorApprovalPolicies: ApprovalPolicyRegistry = {
  read_file: 'auto',
  list_files: 'auto',
  glob: 'auto',
  grep: 'auto',
  get_current_file: 'auto',
  validate_openapi: 'auto',
  summarize_openapi: 'auto',
  edit_file: 'auto',
  write_file: 'approval',
}
