/**
 * Pick the first non-empty heading from a list of candidates.
 *
 * Each candidate is trimmed and the first one with content wins, so the AsyncAPI channel, operation,
 * and message renderers can share a single "prefer the human-friendly title, then fall back to a
 * key" chain instead of repeating the same `title?.trim() || fallback` logic. Returns an empty
 * string when every candidate is missing or blank.
 */
export const pickHeading = (...candidates: Array<string | undefined>): string => {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (trimmed) {
      return trimmed
    }
  }

  return ''
}
