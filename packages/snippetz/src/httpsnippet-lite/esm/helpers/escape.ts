// @ts-nocheck
/**
 * Escape characters within a value to make it safe to insert directly into a
 * snippet. Takes options which define the escape requirements.
 *
 * This is closely based on the JSON-stringify string serialization algorithm,
 * but generalized for other string delimiters (e.g. " or ') and different escape
 * characters (e.g. Powershell uses `)
 *
 * See https://tc39.es/ecma262/multipage/structured-data.html#sec-quotejsonstring
 * for the complete original algorithm.
 */
export function escapeString(rawValue, options = {}) {
  const { delimiter = '"', escapeChar = '\\', escapeNewlines = true } = options
  const stringValue = rawValue.toString()
  return [...stringValue]
    .map((c) => {
      if (c === '\b') {
        return `${escapeChar}b`
      }if (c === '\t') {
        return `${escapeChar}t`
      }if (c === '\n') {
        if (escapeNewlines) {
          return `${escapeChar}n`
        }
        return c // Don't just continue, or this is caught by < \u0020
      }if (c === '\f') {
        return `${escapeChar}f`
      }if (c === '\r') {
        if (escapeNewlines) {
          return `${escapeChar}r`
        }
        return c // Don't just continue, or this is caught by < \u0020
      }if (c === escapeChar) {
        return escapeChar + escapeChar
      }if (c === delimiter) {
        return escapeChar + delimiter
      }if (c < '\u0020' || c > '\u007E') {
        // Delegate the trickier non-ASCII cases to the normal algorithm. Some of these
        // are escaped as \uXXXX, whilst others are represented literally. Since we're
        // using this primarily for header values that are generally (though not 100%
        // strictly?) ASCII-only, this should almost never happen.
        return JSON.stringify(c).slice(1, -1)
      }
      return c
    })
    .join('')
}
/**
 * Make a string value safe to insert literally into a snippet within single quotes,
 * by escaping problematic characters, including single quotes inside the string,
 * backslashes, newlines, and other special characters.
 *
 * If value is not a string, it will be stringified with .toString() first.
 */
export const escapeForSingleQuotes = (value) =>
  escapeString(value, { delimiter: "'" })
/**
 * Make a string value safe to insert literally into a snippet within double quotes,
 * by escaping problematic characters, including double quotes inside the string,
 * backslashes, newlines, and other special characters.
 *
 * If value is not a string, it will be stringified with .toString() first.
 */
export const escapeForDoubleQuotes = (value) =>
  escapeString(value, { delimiter: '"' })
