/**
 * Unicode character for zero-width space
 *
 * @see https://en.wikipedia.org/wiki/Zero-width_space
 */
const ZWSP = '\u200B'

/**
 * A list of preset styles for word breaks
 */
const PRESETS = {
  /** Breaks on `/` and `-` for urls or file paths */
  'path': /[\/-]/,
  /**
   * Breaks on capitals, `_` and `.` for properties written in
   * camel, pascal or snake case
   */
  'property': /[A-Z\_\.-]/,
} as const satisfies Record<string, RegExp>

/** Word break options */
type WordBreakOptions = {
  /**
   * Presets for word wrapping
   */
  preset?: keyof typeof PRESETS
  /**
   * Explicit regex to allow wrapping on, overrides any `preset`
   */
  regex?: RegExp
}

/**
 * String utility to add word break opportunities
 *
 * Adds a zero-width space before certain characters to allow improved
 * line wrapping in the. Allows wrapping on "/" and * "-" by default.
 */
export const addWordBreaks = (label: string, opts: WordBreakOptions = {}): string => {
  const { preset = 'path', regex } = opts
  const wrapRegex = new RegExp(regex ?? PRESETS[preset], 'g')
  return label.replace(wrapRegex, `${ZWSP}$&`)
}
