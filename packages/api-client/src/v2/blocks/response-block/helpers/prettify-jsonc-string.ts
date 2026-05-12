import { applyEdits, format } from 'jsonc-parser'

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
    if (edits.length > 0) {
      return applyEdits(content, edits)
    }
  } catch {
    // applyEdits can throw on malformed edit sequences
  }
  return content
}
