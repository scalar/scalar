import type { ToolPartLike } from '../parts/tool-part'

/**
 * The canonical tool-card status machine of the unification plan:
 * `pending → running | awaiting-approval → applying → complete | failed | rejected`.
 *
 * Every surface derives card rendering from this one mapping instead of
 * re-interpreting AI SDK part states locally.
 */
export type ToolCardStatus =
  | 'pending'
  | 'running'
  | 'awaiting-approval'
  | 'applying'
  | 'complete'
  | 'failed'
  | 'rejected'

/**
 * The rejection texts shipped by existing clients before native denial
 * existed. Persisted histories contain them forever, so they must always be
 * recognized as rejections rather than failures. `agent-chat` emits the
 * first as `output-error` errorText; the editor emits the second inside an
 * `output-available` payload (see `isLegacyRejectionOutput`).
 */
export const LEGACY_REJECTION_MESSAGES = [
  'The user denied the request.',
  'User rejected the write. Ask what they want instead.',
] as const

/** Whether an `output-error` text is a legacy user rejection. */
export const isLegacyRejection = (errorText: string | undefined): boolean =>
  errorText !== undefined && (LEGACY_REJECTION_MESSAGES as readonly string[]).includes(errorText)

/**
 * Whether a tool output payload is the editor's legacy rejection encoding.
 * The shipped editor persists a rejected `write_file` as a *successful* tool
 * output whose payload says `{ ok: false, rejected: true }` — the part state
 * is `output-available`, so the payload is the only signal.
 */
export const isLegacyRejectionOutput = (output: unknown): boolean =>
  typeof output === 'object' &&
  output !== null &&
  'rejected' in output &&
  (output as { rejected: unknown }).rejected === true

/**
 * Client-side context the part state alone cannot carry: whether the local
 * approval store is holding this call for a decision, and whether an approved
 * executor is currently running.
 */
export type ToolCardStatusContext = {
  awaitingApproval?: boolean
  applying?: boolean
}

/**
 * Map an AI SDK tool part (plus local approval context) onto the canonical
 * card status. Handles both approval encodings: the native
 * `approval-requested`/`output-denied` states, and the legacy client-side
 * flow where a pending decision is an `input-available` part held by the
 * approval store and a rejection is an `output-error` with a known text.
 */
export const toolCardStatus = (part: ToolPartLike, context: ToolCardStatusContext = {}): ToolCardStatus => {
  switch (part.state) {
    case 'input-streaming':
      return 'pending'

    case 'input-available': {
      if (context.awaitingApproval) {
        return 'awaiting-approval'
      }

      if (context.applying) {
        return 'applying'
      }

      return 'running'
    }

    case 'approval-requested':
      return 'awaiting-approval'

    case 'approval-responded':
      return part.approval?.approved === false ? 'rejected' : 'applying'

    case 'output-available':
      return isLegacyRejectionOutput(part.output) ? 'rejected' : 'complete'

    case 'output-error':
      return isLegacyRejection(part.errorText) ? 'rejected' : 'failed'

    case 'output-denied':
      return 'rejected'
  }
}
