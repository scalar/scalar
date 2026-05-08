import { resolve } from 'node:path'

/**
 * Resolve a user-provided path against the directory the user actually
 * ran the command from.
 *
 * `pnpm --filter <pkg> start ...` chdirs into the package directory
 * before running the script, which means `process.cwd()` is
 * `tooling/scripts`, not the repo root. pnpm exposes the original
 * directory through `INIT_CWD` for exactly this reason, so we resolve
 * relative paths against it when available and fall back to
 * `process.cwd()` otherwise.
 */
export const resolveUserPath = (input: string): string => {
  return resolve(process.env.INIT_CWD ?? process.cwd(), input)
}
