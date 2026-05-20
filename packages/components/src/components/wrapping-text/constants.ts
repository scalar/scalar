/**
 * A list of preset regexes for word breaks
 */
export const PRESETS = {
  /** Breaks on `/`, '.' and `-` for urls or file paths */
  'path': /[\/\.-]/,
  /**
   * Breaks on capitals, `_` and `.` for properties written in
   * camel, pascal or snake case
   */
  'property': /[A-Z\_\.-]/,
} as const satisfies Record<string, RegExp>
