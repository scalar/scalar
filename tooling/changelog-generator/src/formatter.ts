import type { NewChangesetWithCommit } from '@changesets/types'

import type { GitHubInfo } from './types'

const START_WITH_PR_LINK_PATTERN = /^\[#\d+\].*/

/**
 * Checks if the text starts with a markdown PR link
 * (e.g. "[#123](https://github.com/scalar/scalar/pull/123)")
 * Pattern: [#\d+](...)
 */
function startsWithPRLink(text: string): boolean {
  return START_WITH_PR_LINK_PATTERN.test(text.trim())
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
  options: {
    /**
     * Markdown-formatted link to the associated pull request.
     * When present, it is prepended to the first non-empty line
     * of the changelog entry.
     */
    prLink?: string | null

    /**
     * Two spaces will be added for each indent level.
     */
    indentLevel?: number
  } = {},
): string {
  const { prLink, indentLevel = 0 } = options

  const trimmedLines = text.split('\n').map((line) => line.trim())

  const firstNonEmptyIndex = trimmedLines.findIndex((line) => line !== '')
  if (firstNonEmptyIndex === -1) {
    return ''
  }

  let formattedLines = trimmedLines.map((line, index) => {
    if (index === firstNonEmptyIndex) {
      return prLink ? `- ${prLink}: ${line}` : `- ${line}`
    }

    if (line === '') {
      return ''
    }

    return `  ${line}`
  })

  if (indentLevel > 0) {
    const indent = '  '.repeat(indentLevel)
    formattedLines = formattedLines.map((line) => (line.trim() !== '' ? `${indent}${line}` : ''))
  }

  return formattedLines.join('\n')
}

function getPRLink(githubInfo: GitHubInfo | null): string | null {
  const pullUrl = githubInfo?.links.pull
  const pullNumber = githubInfo?.pull

  if (!pullUrl || !pullNumber) {
    return null
  }

  return startsWithPRLink(pullUrl) ? pullUrl : `[#${pullNumber}](${pullUrl})`
}

export function formatReleaseLine(changeset: NewChangesetWithCommit, githubInfo: GitHubInfo | null): string {
  const prLink = getPRLink(githubInfo)
  return formatChangelogEntry(changeset.summary, { prLink })
}

export function formatDependencyHeader(packageName: string, version: string): string {
  return `- **${packageName}@${version}**`
}

export function formatDependencyChange(githubInfo: GitHubInfo | null, description: string): string {
  if (startsWithPRLink(description)) {
    return formatChangelogEntry(description, { indentLevel: 1 })
  }

  const prLink = getPRLink(githubInfo)
  return formatChangelogEntry(description, { prLink, indentLevel: 1 })
}
