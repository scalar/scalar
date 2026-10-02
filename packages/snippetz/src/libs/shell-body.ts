import type { BodySegment } from './prepare-request'
import { escapeSingleQuotes } from './shell'

/** Stream multipart bytes without putting file data into shell variables. */
export const buildShellBody = (body: BodySegment[], boundary?: string): string => {
  const input = body.map((segment) => {
    if ('file' in segment) {
      return `  cat -- '${escapeSingleQuotes(segment.file)}'`
    }
    const chunks = boundary ? segment.text.split(boundary) : [segment.text]
    return chunks
      .map((chunk) => {
        const text = Array.from(chunk, (character) => {
          if (character === '\\') {
            return '\\\\'
          }
          const code = character.charCodeAt(0)
          return code < 32 ? `\\0${code.toString(8).padStart(3, '0')}` : character
        }).join('')
        return `  printf '%b' '${escapeSingleQuotes(text)}'`
      })
      .join(`\n  printf '%s' "$boundary"\n`)
  })
  return ['{', ...input, '}'].join('\n')
}

/** Pick an unpredictable boundary before starting a shell pipeline. */
export const shellBoundarySetup = `boundary=scalar-$(od -An -N16 -tx1 /dev/urandom | tr -d '[:space:]')\n`

/** Interpolate only framing markers while keeping authored shell values quoted. */
export const quoteShellBoundary = (value: string, boundary?: string): string =>
  (boundary ? value.split(boundary) : [value]).map((part) => `'${escapeSingleQuotes(part)}'`).join('"$boundary"')
