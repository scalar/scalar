/**
 * Escapes single quotes in a string for safe use inside bash single-quoted strings.
 * In bash, you cannot directly escape a single quote inside single quotes (i.e., 'hell\'o' is invalid).
 * Instead, you must close the single quotes, insert an escaped single quote, then reopen the single quotes:
 *
 * ```bash
 * 'hell'\''o'
 * ```
 *
 * This is why escaping a single quote in bash is not as simple as just using a backslash (\' does not work).
 *
 * @example "hell'o" becomes "hell'\''o"
 */
export const escapeSingleQuotes = (value: string): string => value.replace(/'/g, "'\\''")
