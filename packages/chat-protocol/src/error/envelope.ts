import { z } from 'zod'

/**
 * The wire error envelope every Scalar chat endpoint sends on failure.
 *
 * `services/agent` builds these via its `defineError` helper and returns them
 * as JSON at 400/402/403/404. Note that `upgradeUrl` is not a top-level field
 * on the wire — for `LIMIT_REACHED` (402) it rides inside `detail`.
 * `parseChatError()` lifts it out for consumers.
 */
export const chatErrorEnvelopeSchema = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.unknown().optional(),
})

export type ChatErrorEnvelope = z.infer<typeof chatErrorEnvelopeSchema>

/**
 * The legacy client-side error shape `@scalar/agent-chat` has parsed since
 * before the envelope existed. Frozen clients (published docs sites and
 * customer-embedded API references) still produce and expect it, so it can
 * never be removed — only contained here.
 */
export const legacyChatErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  status: z.number().optional(),
})

export type LegacyChatError = z.infer<typeof legacyChatErrorSchema>

/**
 * Error codes shared across chat surfaces.
 *
 * Per-domain servers define more (for example `EDITOR_PROJECT_NOT_FOUND`);
 * `code` stays an open string on the wire. These constants cover the codes
 * client UIs branch on.
 */
export const ChatErrorCodes = {
  /** The user hit the usage limit (HTTP 402). `detail.upgradeUrl` points at the plan page. */
  LIMIT_REACHED: 'LIMIT_REACHED',
  /** A user message exceeded the prompt size limit. */
  PROMPT_TOO_LARGE: 'PROMPT_TOO_LARGE',
  /** The request was not authorized for the target resource. */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** The agent failed while producing a response. */
  AGENT_FAILED: 'AGENT_FAILED',
  /** Fallback when an error cannot be parsed into a known shape. */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ChatErrorCode = (typeof ChatErrorCodes)[keyof typeof ChatErrorCodes]
