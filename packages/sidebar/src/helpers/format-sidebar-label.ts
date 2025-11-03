/** Format options */
type FormatOptions = {
  /**
   * The characters to allow wrapping on
   * @default /[\/-]/g - allow wrapping on "/" and "-"
   */
  wrapCharacters?: RegExp
}

/**
 * Unicode character for zero-width space
 *
 * @see https://en.wikipedia.org/wiki/Zero-width_space
 */
const ZWSP = '\u200B'

/** Default format options */
const defaultFormatOptions = {
  wrapCharacters: /[\/-]/g,
} as const satisfies FormatOptions

/**
 * Format the sidebar label
 *
 * Adds a zero-width space after the certain characters to allow improved * line wrapping in the sidebar. By default, it allows wrapping on "/" and * "-". To not add a zero-width space, pass an empty string for the * wrapCharacters option.
 */
export const formatSidebarLabel = (label: string, opts: FormatOptions = {}): string => {
  const { wrapCharacters } = { ...defaultFormatOptions, ...opts }
  return label.replace(wrapCharacters, `${ZWSP}$&`) // replace the characters with the zero-width space and the character
}
