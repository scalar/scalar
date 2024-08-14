export function isKeyNeedsQuotes(key: string) {
  return /\s|-/.test(key)
}
