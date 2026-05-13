import { type Result, err, ok } from './result'

const formatCaughtError = (error: unknown): string => (error instanceof Error ? error.message : String(error))

/**
 * Run a function and capture any thrown error as a {@link Result} so callers
 * never have to write `try/catch` themselves.
 *
 * **Overload:** when `fn` returns a `Promise`, the return type is
 * `Promise<Result<T>>` and rejections become `err(message)` — the promise
 * never rejects.
 *
 * **Overload:** when `fn` returns a plain value synchronously, the return type
 * is `Result<T>` with no promise wrapper. You may still `await` that value;
 * it behaves like an immediate result.
 *
 * Failures are logged with `console.error` so unexpected errors stay visible
 * in devtools while the caller decides how to present them to the user.
 *
 * @example Async (always `await` the outer promise)
 * const outcome = await safeRun(() => fetcher())
 * isLoading.value = false
 * if (!outcome.ok) {
 *   toast(outcome.error, 'error')
 *   return
 * }
 * useData(outcome.data)
 *
 * @example Sync (no `await` required)
 * const outcome = safeRun(() => JSON.parse(raw))
 * if (!outcome.ok) {
 *   toast(outcome.error, 'error')
 *   return
 * }
 * useData(outcome.data)
 */
export function safeRun<T>(fn: () => Promise<T>): Promise<Result<T>>
export function safeRun<T>(fn: () => T): Result<T>
export function safeRun<T>(fn: () => T | Promise<T>): Result<T> | Promise<Result<T>> {
  try {
    const out = fn()
    if (out instanceof Promise) {
      return out.then(
        (data) => ok(data as T),
        (error: unknown) => {
          console.error(error)
          return err(formatCaughtError(error))
        },
      )
    }
    return ok(out as T)
  } catch (error) {
    console.error(error)
    return err(formatCaughtError(error))
  }
}
