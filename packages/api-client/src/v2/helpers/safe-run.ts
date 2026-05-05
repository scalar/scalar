/**
 * Run a function and capture any thrown error as a tagged result so callers
 * never have to write `try/catch` themselves.
 *
 * Resolves to `{ ok: true, data }` when `fn` returns (or its promise
 * resolves) and to `{ ok: false, error }` when it throws synchronously or
 * the returned promise rejects. The error is also logged via `console.error`
 * so unexpected failures still surface in the devtools console while the
 * caller decides how to present them to the user.
 *
 * Useful for guarding `await`s where a rejection would otherwise leave UI
 * state inconsistent (e.g. a loading flag that is reset only on the success
 * path). Because `safeRun` itself never rejects, the post-await cleanup can
 * run on the next line without a `try/finally` block.
 *
 * @example
 * const outcome = await safeRun(() => fetcher())
 * isLoading.value = false
 * if (!outcome.ok) {
 *   toast(outcome.error, 'error')
 *   return
 * }
 * useData(outcome.data)
 */
export const safeRun = async <T>(fn: () => Promise<T> | T) => {
  try {
    return {
      ok: true,
      data: await fn(),
    } as const
  } catch (error) {
    console.error(error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}
