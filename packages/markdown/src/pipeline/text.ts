/**
 * Linear-time trimming of a set of characters.
 *
 * A regular expression such as `/[ \t]+$/` looks like it should be linear, but
 * without an anchor at the start the engine retries it from every position
 * inside a long run of those characters that is not at the end, which is
 * quadratic. Descriptions are untrusted input, so the parsers trim by scanning.
 */

/** `s` without the characters of `chars` at its end. */
export const trimEnd = (s: string, chars: string): string => {
  let end = s.length
  while (end > 0 && chars.includes(s[end - 1]!)) end--
  return end === s.length ? s : s.slice(0, end)
}

/** `s` without the characters of `chars` at its start. */
export const trimStart = (s: string, chars: string): string => {
  let start = 0
  while (start < s.length && chars.includes(s[start]!)) start++
  return start === 0 ? s : s.slice(start)
}

/** `s` without the characters of `chars` at either end. */
export const trim = (s: string, chars: string): string => trimStart(trimEnd(s, chars), chars)
