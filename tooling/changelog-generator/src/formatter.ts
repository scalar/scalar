import type { NewChangesetWithCommit } from '@changesets/types'

import type { GitHubInfo } from './types'

export function formatReleaseLine(changeset: NewChangesetWithCommit, githubInfo: GitHubInfo | null): string {
  const description = changeset.summary.trim()

  const prLink = getPRLink(githubInfo)
  if (prLink) {
    return `- ${prLink}: ${description}`
  }

  return `- ${description}`
}

/**
 * Checks if the text already contains a markdown PR link (e.g. "[#123](https://github.com/scalar/scalar/pull/123)")
 * Pattern: [#\d+](...)
 */
function containsPRLink(text: string): boolean {
  const prLinkPattern = /^\[#\d+\].*/
  return prLinkPattern.test(text.trim())
}

export function getPRLink(githubInfo: GitHubInfo | null): string | null {
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
  const trimmedDescription = description.trim()

  if (containsPRLink(trimmedDescription)) {
    return `  - ${trimmedDescription}`
  }

  const prLink = getPRLink(githubInfo)
  if (prLink) {
    return `  - ${prLink}: ${trimmedDescription}`
  }

  return `  - ${trimmedDescription}`
}
