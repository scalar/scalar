import { prettifyJsoncString } from '@/v2/blocks/response-block/helpers/prettify-jsonc-string'

/**
 * Pretty-print newline-delimited JSON (NDJSON) for preview.
 *
 * NDJSON is one JSON value per line, so we format each line on its own and
 * separate the records with a blank line to keep them visually distinct.
 * Empty lines are dropped and any line that is not valid JSON is passed through
 * unchanged, so a malformed or partial record never breaks the whole preview.
 */
export function prettifyNdjson(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => prettifyJsoncString(line))
    .join('\n\n')
}
