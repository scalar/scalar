/** Checks whether the given string is an URL */
export function isUrl(input: string | null) {
  return input && (input.startsWith('http://') || input.startsWith('https://'))
}
