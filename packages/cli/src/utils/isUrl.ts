/**
 * Check if the input is a URL.
 */
export function isUrl(text: string): boolean {
  return (
    typeof text === 'string' &&
    (text.startsWith('http://') || text.startsWith('https://'))
  )
}
