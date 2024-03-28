/**
 * Simple 32 bit non-secure hash from a string input
 *
 * @see https://stackoverflow.com/a/7616484/1624255
 */
export const createHash = (input?: string): number => {
  let chr = 0
  let hash = 0
  let i = 0

  if (!input?.length) return hash

  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}
