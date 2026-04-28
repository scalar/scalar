const RE_NON_WORD = /[^\p{L}\p{M}\p{N}\s-]/gu
const RE_SPACES = /[\s-]+/g
const RE_TRIM_HYPHENS = /^-+|-+$/g

/** Cache of compiled non-word regexes keyed by their `allowedSpecialChars` string. */
const reNonWordCache = new Map<string, RegExp>()

/**
 * Options for {@link slugify}.
 *
 * | Option               | Type       | Default | Description                                                                                  |
 * |----------------------|------------|---------|----------------------------------------------------------------------------------------------|
 * | `preserveCase`       | `boolean`  | `false` | When `true`, skips lowercasing so the original casing is kept (e.g. `"MyAPI"` → `"MyAPI"`). |
 * | `allowedSpecialChars`| `string`   | `""`    | Extra characters that should survive the non-word filter (e.g. `"."` keeps dots so `"v1.2"` → `"v1.2"` instead of `"v12"`). |
 */
export type SlugifyOptions = {
  /** When `true`, skips lowercasing so the original casing is preserved. */
  preserveCase?: boolean
  /**
   * A string of extra characters to allow through the non-word filter.
   * Each character in the string is treated literally.
   * @example '.' // keeps dots: "v1.2.3" → "v1.2.3"
   * @example '.@' // keeps dots and at-signs
   */
  allowedSpecialChars?: string
}

/**
 * Normalizes and slugifies a string.
 *
 * By default the result is lowercased, limited to 255 characters, and stripped
 * of everything that is not a Unicode letter, mark, number, hyphen, or space
 * (spaces and hyphens are then collapsed into a single hyphen).
 *
 * Pass {@link SlugifyOptions} to adjust this behaviour.
 *
 * Copied over from @scalar-org
 */
export const slugify = (v: string, options: SlugifyOptions = {}) => {
  const { preserveCase = false, allowedSpecialChars = '' } = options

  let reNonWord: RegExp
  if (allowedSpecialChars.length > 0) {
    const cached = reNonWordCache.get(allowedSpecialChars)
    if (cached) {
      reNonWord = cached
    } else {
      const escaped = allowedSpecialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      reNonWord = new RegExp(`[^\\p{L}\\p{M}\\p{N}\\s\\-${escaped}]`, 'gu')
      reNonWordCache.set(allowedSpecialChars, reNonWord)
    }
  } else {
    reNonWord = RE_NON_WORD
  }

  let result = v.slice(0, 255).trim().normalize('NFC')

  if (!preserveCase) {
    result = result.toLowerCase()
  }

  return result.replace(reNonWord, '').replace(RE_SPACES, '-').replace(RE_TRIM_HYPHENS, '')
}
