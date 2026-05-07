/**
 * Pull a single version's section out of a Changesets-style `CHANGELOG.md`.
 *
 * Changesets writes each release as a top-level `## <version>` heading
 * followed by patch / minor / major subsections. We extract everything
 * between that heading and the next `## ` heading so the AI prompt only
 * sees the changes for the release we are summarising - never older
 * entries that would confuse the model.
 */
export const extractChangelogSection = (markdown: string, version: string): string | null => {
  const lines = markdown.split('\n')
  // Match `## 3.5.1` only (not `### …`). Escape metacharacters in
  // `version` with one backslash each; include `\]` in the class so `]`
  // does not terminate it early.
  const headingPattern = new RegExp(`^##\\s+${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`)

  let startIndex = -1
  for (let index = 0; index < lines.length; index += 1) {
    if (headingPattern.test(lines[index] ?? '')) {
      startIndex = index + 1
      break
    }
  }

  if (startIndex === -1) {
    return null
  }

  let endIndex = lines.length
  for (let index = startIndex; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index] ?? '')) {
      endIndex = index
      break
    }
  }

  const section = lines.slice(startIndex, endIndex).join('\n').trim()
  return section.length > 0 ? section : null
}
