const RE_NON_WORD = /[^\p{L}\p{M}\p{N}\s_-]/gu
const RE_SPACES = /[\s_-]+/g
const RE_TRIM_HYPHENS = /^-+|-+$/g

/**
 * Matches all Unicode combining marks (accents, diacritics, etc.).
 * Used with NFD-decomposed text so base letters and their marks are
 * separate code points and the marks can be dropped cleanly.
 */
const RE_COMBINING_MARKS = /\p{M}/gu

/** Cache of compiled non-word regexes keyed by their `allowedSpecialChars` string. */
const reNonWordCache = new Map<string, RegExp>()

/**
 * Unicode normalization forms used by `String.prototype.normalize()`:
 * - `NFC`: canonical decomposition followed by recomposition (default for most text).
 * - `NFD`: canonical decomposition (splits accents from base letters).
 * - `NFKC`: compatibility decomposition followed by recomposition (folds ligatures and width variants).
 * - `NFKD`: compatibility decomposition (like `NFKC` without recomposition).
 */
export type NormalizationForm = 'NFC' | 'NFD' | 'NFKC' | 'NFKD'

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
  /**
   * Unicode normalization form applied to the input before slugifying.
   * Has no effect when `stripAccents` is `true`, which always uses NFD
   * internally to decompose accented letters before stripping them.
   * @default 'NFC'
   * @example slugify('ﬁle', { normalizationForm: 'NFKC' }) // 'file' (ligature → two letters)
   */
  normalizationForm?: NormalizationForm
  /**
   * When `true`, strips combining diacritical marks (accents) from letters,
   * producing ASCII-friendly slugs from accented text.
   *
   * Internally normalizes to NFD so that base letters and their accent marks
   * become separate code points, then removes all Unicode combining marks
   * (`\p{M}`). This takes precedence over `normalizationForm`.
   *
   * @default false
   * @example slugify('Crème Brûlée', { stripAccents: true }) // 'creme-brulee'
   */
  stripAccents?: boolean
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
 * | Option               | Type                | Default | Description                                                                                                             |
 * |----------------------|---------------------|---------|------------------------------------------------------------------------------------------------------------------------ |
 * | `allowedSpecialChars`| `string`            | `""`    | Extra characters that should survive the non-word filter (e.g. `"."` keeps dots so `"v1.2"` → `"v1.2"` instead of `"v12"`). |
 * | `preserveCase`       | `boolean`           | `false` | When `true`, the case is preserved. By default we lowercase the string.                                                 |
 * | `normalizationForm`  | `NormalizationForm` | `'NFC'` | Unicode normalization form to apply. Ignored when `stripAccents` is `true`.                                             |
 * | `stripAccents`       | `boolean`           | `false` | When `true`, strips diacritical marks so e.g. `"Crème"` → `"creme"`. Takes precedence over `normalizationForm`.        |
 */
export const slugify = (v: string, options: SlugifyOptions = {}) => {
  const { allowedSpecialChars = '', preserveCase = false, normalizationForm = 'NFC', stripAccents = false } = options

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

  const trimmed = v.slice(0, 255).trim()

  // NFD decomposes accented letters into base letter + combining mark, so the
  // marks can be stripped cleanly with a single regex pass.
  const normalized = stripAccents
    ? trimmed.normalize('NFD').replace(RE_COMBINING_MARKS, '')
    : trimmed.normalize(normalizationForm)

  const result = preserveCase ? normalized : normalized.toLowerCase()

  return result.replace(reNonWord, '').replace(RE_SPACES, '-').replace(RE_TRIM_HYPHENS, '')
}
