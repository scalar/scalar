/**
 * Concatenates any number of pre/post-request scripts into a single string,
 * trimming empty/undefined values and separating them with newlines.
 *
 * Useful for merging scripts defined at different levels (document, operation, etc.).
 */
export const getScript = (...args: (string | undefined | null)[]): string => {
  return args
    .map((script) => script?.trim())
    .filter((script) => typeof script === 'string' && script.length > 0)
    .join('\n')
}
