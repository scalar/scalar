const RE_NON_WORD = /[^\p{L}\p{M}\p{N}\s-]/gu
const RE_SPACES = /[\s-]+/g
const RE_TRIM_HYPHENS = /^-+|-+$/g

/**
 * Normalizes and slugifies a string
 *
 * Copied over from @scalar-org
 */
export const slugify = (v: string) =>
  v
    .slice(0, 255)
    .trim()
    .normalize('NFC')
    .toLowerCase()
    .replace(RE_NON_WORD, '')
    .replace(RE_SPACES, '-')
    .replace(RE_TRIM_HYPHENS, '')
