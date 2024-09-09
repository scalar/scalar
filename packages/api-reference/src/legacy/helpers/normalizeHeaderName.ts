/**
 * Make the first letter and all letters after a dash uppercase
 */
export function normalizeHeaderName(name: string) {
  // Split the header name by hyphens
  return (
    name
      .split('-')
      // Capitalize the first letter of each part
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      // Join the parts back together with hyphens
      .join('-')
  )
}
