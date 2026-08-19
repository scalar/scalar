import { z } from 'zod'

import { ChatErrorCodes, chatErrorEnvelopeSchema, legacyChatErrorSchema } from './envelope'

/**
 * A chat error normalized for rendering, whatever shape it arrived in.
 */
export type ParsedChatError = {
  code: string
  message: string
  /** HTTP status, when the legacy client shape carried one. */
  status?: number
  /** Lifted from `detail.upgradeUrl` when the server sent one (`LIMIT_REACHED`). */
  upgradeUrl?: string
  /** The raw `detail` payload of the wire envelope, when present. */
  detail?: unknown
}

const safeParseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

const upgradeUrlFromDetail = (detail: unknown): string | undefined => {
  if (typeof detail === 'object' && detail !== null && 'upgradeUrl' in detail) {
    const upgradeUrl = (detail as { upgradeUrl: unknown }).upgradeUrl

    if (typeof upgradeUrl === 'string') {
      return upgradeUrl
    }
  }

  return undefined
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.'

/**
 * The wire envelope and the legacy client shape overlap structurally (both
 * carry `code`), so one merged parse handles either — `detail` comes from
 * the envelope, `status` from the legacy shape. Derived from the canonical
 * schemas so a field added there propagates here. `message` is loosened to
 * optional: the shipped OpenAPI chat route serializes its 403/400 errors
 * without one, and the code is the field UIs branch on.
 */
const anyChatErrorSchema = z
  .object({
    ...chatErrorEnvelopeSchema.shape,
    ...legacyChatErrorSchema.shape,
  })
  .partial({ message: true })

const fromCandidate = (candidate: unknown): ParsedChatError | undefined => {
  const parsed = anyChatErrorSchema.safeParse(candidate)

  if (!parsed.success) {
    return undefined
  }

  return {
    code: parsed.data.code,
    message: parsed.data.message ?? FALLBACK_MESSAGE,
    status: parsed.data.status,
    upgradeUrl: upgradeUrlFromDetail(parsed.data.detail),
    detail: parsed.data.detail,
  }
}

/**
 * Parse anything a chat transport can surface into a renderable error.
 *
 * The AI SDK surfaces server errors as an `Error` whose `.message` is the
 * JSON-serialized wire envelope — every surface today re-parses that string
 * independently. This is the one shared implementation. It accepts:
 *
 * - an `Error` with a JSON envelope (or legacy shape) in `.message`
 * - an already-parsed envelope object
 * - a raw JSON string
 * - anything else, which falls back to `UNKNOWN_ERROR` with a best-effort message
 */
export const parseChatError = (error: unknown): ParsedChatError => {
  if (error instanceof Error) {
    const candidate = safeParseJson(error.message)
    return (
      fromCandidate(candidate) ?? {
        code: ChatErrorCodes.UNKNOWN_ERROR,
        message: error.message,
      }
    )
  }

  if (typeof error === 'string') {
    return (
      fromCandidate(safeParseJson(error)) ?? {
        code: ChatErrorCodes.UNKNOWN_ERROR,
        message: error,
      }
    )
  }

  return (
    fromCandidate(error) ?? {
      code: ChatErrorCodes.UNKNOWN_ERROR,
      message: FALLBACK_MESSAGE,
    }
  )
}
