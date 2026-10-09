import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'

/** Encodes a chunk name as one portable filename and URL segment. */
export const encodeChunkName = (name: string): string => {
  // JSON Pointer escaping preserves existing names and reserves ~x for filesystem escapes.
  const escaped = escapeJsonPointer(name).replace(
    /[^a-zA-Z0-9_.~{}-]/gu,
    (character) => `~x${character.codePointAt(0)?.toString(16)}~`,
  )
  // Scan once from the end to avoid regex backtracking over long runs of interior dots.
  let trailingDotsStart = escaped.length
  while (trailingDotsStart > 0 && escaped[trailingDotsStart - 1] === '.') {
    trailingDotsStart--
  }
  const portable = escaped.slice(0, trailingDotsStart) + '~x2e~'.repeat(escaped.length - trailingDotsStart)

  // Windows device names remain reserved even when followed by a file extension.
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(portable) || portable === '' ? `~x~${portable}` : portable
}
