import { prettifyJsoncString } from '@/v2/blocks/response-block/helpers/prettify-jsonc-string'

/**
 * Pretty-print newline-delimited JSON (NDJSON) for preview.
 *
 * NDJSON is one JSON value per line, so we format each line on its own and
 * separate the records with a blank line to keep them visually distinct.
 * Empty lines are dropped. Formatting is lenient: each line is reformatted as
 * far as the JSONC formatter can restructure it, and anything it cannot parse
 * is left as-is rather than rejected, so a malformed or partial record never
 * breaks the whole preview.
 */
export function prettifyNdjson(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => prettifyJsoncString(line))
    .join('\n\n')
}
