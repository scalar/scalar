/**
 * Discriminated union for an outcome that can either succeed with `data`
 * or fail with a typed `error`.
 *
 * The error type defaults to `string` so existing call sites that just
 * return a free-form message keep working without changes. Pass a string
 * literal union (or any other shape) as the second type argument when
 * the failure should be branded with discriminated codes the caller can
 * exhaustively switch on.
 *
 * The optional `message` field carries human-readable detail and is
 * always available regardless of which error shape is used, so consumers
 * can surface it in toasts and logs without having to model it on every
 * error variant.
 *
 * @example Free-form error (default).
 * type Loaded = Result<User>
 * // -> { ok: true; data: User }
 * //  | { ok: false; error: string; message?: string }
 *
 * @example Discriminated error code + human message.
 * type Published = Result<
 *   { commitHash: string },
 *   'CONFLICT' | 'FETCH_FAILED' | 'UNAUTHORIZED'
 * >
 *
 * @example Custom error shape.
 * type Parsed = Result<Document, { code: number; field: string }>
 */
export type Result<T, E = string> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      /** Typed error value. Defaults to a free-form string. */
      error: E
      /** Human-readable detail for logging or surfaced error messages. */
      message?: string
    }

/**
 * Convenience constructor for the success variant of {@link Result}.
 *
 * Lets call sites avoid spelling out `{ ok: true, data: ... }` over and
 * over while keeping the discriminant inferable.
 *
 * @example
 * return ok(user)
 */
export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data })

/**
 * Convenience constructor for the failure variant of {@link Result}.
 *
 * Accepts the typed error and an optional human-readable message so
 * callers can surface user-facing details alongside the discriminated
 * code.
 *
 * @example
 * return err('CONFLICT', 'Slug is already taken')
 *
 * @example
 * return err('Document not found')
 */
export const err = <E>(error: E, message?: string): Result<never, E> => ({
  ok: false,
  error,
  message,
})
