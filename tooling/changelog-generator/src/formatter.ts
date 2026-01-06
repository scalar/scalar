import type { NewChangesetWithCommit } from '@changesets/types'

import type { GitHubInfo } from './types'

/**
 * Checks if the text already contains a markdown PR link (e.g. "[#123](https://github.com/scalar/scalar/pull/123)")
 * Pattern: [#\d+](...)
 */
function containsPRLink(text: string): boolean {
  const prLinkPattern = /^\[#\d+\].*/
  return prLinkPattern.test(text.trim())
}

/**
 * Converts a multi-line changelog fragment into a single Markdown list entry.
 *
 * The first non-empty line becomes the parent list item. Any subsequent
 * non-empty lines are indented so they render as nested list items under
 * the parent entry. Blank lines are preserved.
 *
 * Optionally prefixes the parent entry with a PR link and applies an
 * additional indentation level to all output lines.
 */
function formatChangelogEntry(
  text: string,
  {
    prLink,
    indentLevel: indentWith = 0,
  }: {
    prLink?: string | null
    /**
     * two spaces will be added for each indent level
     */
    indentLevel?: number
  } = {},
): string {
  const lines = text.trim().split('\n')

  const firstNonEmpty = lines.findIndex((l) => l.trim() !== '')
  if (firstNonEmpty === -1) {
    return ''
  }

  return (
    lines
      .map((line, i) => {
        if (i === firstNonEmpty) {
          if (prLink) {
            return `- ${prLink}: ${line.trim()}`
          }
          return `- ${line.trim()}`
        }

        if (line.trim() === '') {
          return ''
        }
        return `  ${line.trim()}`
      })
      // Add indent for each line with some content
      .map((it) => (it.trim() !== '' ? `${'  '.repeat(indentWith)}${it}` : ''))
      .join('\n')
  )
}

export function formatReleaseLine(changeset: NewChangesetWithCommit, githubInfo: GitHubInfo | null): string {
  const prLink = getPRLink(githubInfo)
  return formatChangelogEntry(changeset.summary, { prLink })
}

function getPRLink(githubInfo: GitHubInfo | null): string | null {
  if (!githubInfo || !githubInfo.links.pull) {
    return null
  }

  if (containsPRLink(githubInfo.links.pull)) {
    return githubInfo.links.pull
  }

  return `[#${githubInfo.pull}](${githubInfo.links.pull})`
}

export function formatDependencyHeader(packageName: string, version: string): string {
  return `- **${packageName}@${version}**`
}

export function formatDependencyChange(githubInfo: GitHubInfo | null, description: string): string {
  if (containsPRLink(description)) {
    return formatChangelogEntry(description, { indentLevel: 1 })
  }

  const prLink = getPRLink(githubInfo)
  return formatChangelogEntry(description, { prLink, indentLevel: 1 })
}
