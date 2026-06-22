/**
 * Pull a single version's section out of a Changesets-style `CHANGELOG.md`.
 */
export const extractChangelogSection = (markdown: string, version: string): string | null => {
  const lines = markdown.split('\n')
  const headingPattern = new RegExp(`^##\\s+${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`)

  const startIndex = lines.findIndex((line) => headingPattern.test(line))
  if (startIndex === -1) {
    return null
  }

  const contentStartIndex = startIndex + 1
  const nextHeadingOffset = lines.slice(contentStartIndex).findIndex((line) => /^##\s+/.test(line))
  const endIndex = nextHeadingOffset === -1 ? lines.length : contentStartIndex + nextHeadingOffset
  const section = lines.slice(contentStartIndex, endIndex).join('\n').trim()

  return section.length > 0 ? section : null
}
