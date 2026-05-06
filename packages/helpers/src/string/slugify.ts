const RE_NON_WORD = /[^\p{L}\p{M}\p{N}\s_-]/gu
const RE_SPACES = /[\s_-]+/g
const RE_TRIM_HYPHENS = /^-+|-+$/g

/** Cache of compiled non-word regexes keyed by their `allowedSpecialChars` string. */
const reNonWordCache = new Map<string, RegExp>()

export type SlugifyOptions = {
  /**
   * A string of extra characters to allow through the non-word filter.
   * Each character in the string is treated literally.
   * @example '.' // keeps dots: "v1.2.3" → "v1.2.3"
   * @example '.@' // keeps dots and at-signs
   */
  allowedSpecialChars?: string
  /**
   * When `true`, the result is preserved as-is (i.e. case is preserved). By default we lowercase the string.
   * @default false
   * @example slugify('MyAPI', { preserveCase: true }) // 'MyAPI'
   */
  preserveCase?: boolean
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
 * | Option               | Type       | Default | Description                                                                                  |
 * |----------------------|------------|---------|----------------------------------------------------------------------------------------------|
 * | `allowedSpecialChars`| `string`   | `""`    | Extra characters that should survive the non-word filter (e.g. `"."` keeps dots so `"v1.2"` → `"v1.2"` instead of `"v12"`). |
 * | `preserveCase`       | `boolean`  | `false` | When `true`, the case is preserved. By default we lowercase the string |
 */
export const slugify = (v: string, options: SlugifyOptions = {}) => {
  const { allowedSpecialChars = '', preserveCase = false } = options

  // Compile the non-word regex once and cache it for future use.
  const reNonWord = (() => {
    if (allowedSpecialChars.length === 0) {
      return RE_NON_WORD
    }

    const cached = reNonWordCache.get(allowedSpecialChars)
    if (cached) {
      return cached
    }

    // Escape user-provided characters so they are treated literally inside the character class.
    const escaped = allowedSpecialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    const reNonWordWithAllowedSpecialChars = new RegExp(`[^\\p{L}\\p{M}\\p{N}\\s_\\-${escaped}]`, 'gu')
    reNonWordCache.set(allowedSpecialChars, reNonWordWithAllowedSpecialChars)

    return reNonWordWithAllowedSpecialChars
  })()

  // Normalize before filtering so equivalent Unicode forms produce the same slug.
  const normalized = v.slice(0, 255).trim().normalize('NFC')
  const result = preserveCase ? normalized : normalized.toLowerCase()

  return result.replace(reNonWord, '').replace(RE_SPACES, '-').replace(RE_TRIM_HYPHENS, '')
}
