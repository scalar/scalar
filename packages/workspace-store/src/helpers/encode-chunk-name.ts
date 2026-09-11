import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'

/** Encodes a chunk name as one portable filename and URL segment. */
export const encodeChunkName = (name: string): string => {
  // JSON Pointer escaping preserves existing names and reserves ~x for filesystem escapes.
  const escaped = escapeJsonPointer(name).replace(
    /[^a-zA-Z0-9_.~{}-]/gu,
    (character) => `~x${character.codePointAt(0)?.toString(16)}~`,
  )
  const portable = escaped.replace(/\.+$/, (dots) => dots.replaceAll('.', '~x2e~'))

  // Windows device names remain reserved even when followed by a file extension.
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(portable) || portable === '' ? `~x~${portable}` : portable
}
