/**
 * Converts a string into a URL-friendly "slug" by
 * lowercasing and replacing whitespace with hyphens.
 *
 * Example:
 *   slugify('Hello World Example')  // returns 'hello-world-example'
 */
export const slugify = (value: string) => {
  return value.toLowerCase().replace(/\s+/g, '-')
}
