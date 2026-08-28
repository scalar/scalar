import type { MockServerLogger } from '@/types'

/**
 * Resolve the `logger` option accepted by the mock server factories into a concrete sink.
 *
 * The option is a superset of a plain sink:
 * - a function is used as-is,
 * - `true` logs each line to the console,
 * - `false` drops every line,
 * - `undefined` falls back to the factory's default (`enabledByDefault`).
 */
export const resolveLogger = (
  logger: boolean | MockServerLogger | undefined,
  enabledByDefault: boolean,
): MockServerLogger => {
  const value = logger ?? enabledByDefault

  if (typeof value === 'function') {
    return value
  }

  return value ? (line) => console.log(line) : () => undefined
}
