import { parseMimeType } from './mime-type'

/** Match JSON media types and structured JSON suffixes, ignoring case and parameters. */
export const isJsonMediaType = (value: string | undefined): boolean => {
  const { subtype } = parseMimeType(value)
  return subtype === 'json' || subtype.endsWith('+json')
}
