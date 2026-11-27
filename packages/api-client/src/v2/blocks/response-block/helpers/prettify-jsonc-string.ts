import { format } from 'jsonc-parser'

const jsoncFormatOptions = {
  tabSize: 2,
  insertSpaces: true,
  eol: '\n',
} as const

/**
 * Pretty-print JSON/JSONC for preview without round-tripping through JSON.parse,
 * so digit sequences in large integers stay exact in the string.
 */
export function prettifyJsoncString(content: string): string {
  try {
    const edits = format(content, undefined, jsoncFormatOptions)
    if (edits.length === 0) {
      return content
    }

    // Stitch edits against the original text. Replacing them one at a time
    // copies large parts of the document for each whitespace edit.
    edits.sort((a, b) => a.offset - b.offset || a.length - b.length)
    const parts: string[] = []
    let cursor = 0
    for (const { offset, length, content: replacement } of edits) {
      if (offset < cursor || offset + length > content.length) {
        return content
      }
      parts.push(content.slice(cursor, offset), replacement)
      cursor = offset + length
    }
    parts.push(content.slice(cursor))
    return parts.join('')
  } catch {
    return content
  }
}
