import { slugify } from '@scalar/helpers/string/slugify'

/**
 * Pick the filename (without extension) for a downloaded document.
 *
 * A configured slug wins because the user chose it. A generated slug like `api-1` says nothing about the
 * API, so we name the file after the document title instead, and fall back to `openapi` when the title
 * is missing or has no characters that survive slugification.
 */
export const getDownloadFilename = ({
  slug,
  isSlugGenerated,
  title,
}: {
  /** The slug of the active document */
  slug: string | undefined
  /** Whether the slug is a positional placeholder rather than one derived from the configuration */
  isSlugGenerated: boolean | undefined
  /** The `info.title` of the active document */
  title: string | undefined
}): string => {
  if (slug && isSlugGenerated === false) {
    return slug
  }

  const titleSlug = slugify(title ?? '')
  if (titleSlug) {
    return titleSlug
  }

  return 'openapi'
}
