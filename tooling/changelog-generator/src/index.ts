import { getInfo } from '@changesets/get-github-info'
import type { ChangelogFunctions, ModCompWithPackage, NewChangesetWithCommit } from '@changesets/types'

import { formatDependencyChange, formatDependencyHeader, formatReleaseLine } from './formatter'

const changelogFunctions: ChangelogFunctions = {
  getReleaseLine: async (changeset: NewChangesetWithCommit, _type: string, options: Record<string, any> | null) => {
    const repo = options?.repo
    if (!repo) {
      throw new Error('Please provide a `repo` option. It should be a string like "user/repo".')
    }

    const [firstLine] = changeset.summary
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    let prFromSummary: number | undefined

    // Extract PR number from summary if present (format: "PR #123" or "#123")
    const prMatch = firstLine?.match(/#(\d+)/)
    if (prMatch) {
      prFromSummary = Number.parseInt(prMatch[1]!, 10)
    }

    // Get GitHub info for the commit
    const githubInfo = changeset.commit
      ? await getInfo({
          repo,
          commit: changeset.commit,
        })
      : null

    // Use PR from GitHub info if available, otherwise fall back to summary
    const prNumber = githubInfo?.links.pull
      ? Number.parseInt(githubInfo.links.pull.split('/').pop() || '', 10)
      : prFromSummary

    // Create a GitHub info object with PR link
    const githubInfoWithPR = githubInfo
      ? {
          ...githubInfo,
          pull: prNumber || githubInfo.pull,
          links: {
            ...githubInfo.links,
            pull: prNumber ? `https://github.com/${repo}/pull/${prNumber}` : githubInfo.links.pull,
          },
        }
      : prNumber
        ? {
            user: null,
            pull: prNumber,
            links: {
              commit: changeset.commit ? `https://github.com/${repo}/commit/${changeset.commit}` : '',
              pull: `https://github.com/${repo}/pull/${prNumber}`,
              user: null,
            },
          }
        : null

    return formatReleaseLine(changeset, githubInfoWithPR)
  },

  getDependencyReleaseLine: async (
    changesets: NewChangesetWithCommit[],
    dependenciesUpdated: ModCompWithPackage[],
    options: Record<string, any> | null,
  ) => {
    const repo = options?.repo
    if (!repo) {
      throw new Error('Please provide a `repo` option. It should be a string like "user/repo".')
    }

    if (dependenciesUpdated.length === 0) {
      return ''
    }

    const lines: string[] = []
    lines.push('#### Updated Dependencies')
    lines.push('')

    // Group dependencies by package name
    for (const dependency of dependenciesUpdated) {
      const packageName = dependency.name
      const version = dependency.newVersion

      lines.push(formatDependencyHeader(packageName, version))

      // Find all changesets that affected this dependency
      const relevantChangesets = changesets.filter((changeset) =>
        changeset.releases.some((release) => release.name === packageName),
      )

      // Get GitHub info for each changeset and format the changes
      for (const changeset of relevantChangesets) {
        const githubInfo = changeset.commit
          ? await getInfo({
              repo,
              commit: changeset.commit,
            })
          : null

        const changeLine = formatDependencyChange(githubInfo, changeset.summary)
        lines.push(changeLine)
      }

      lines.push('')
    }

    return lines.join('\n')
  },
}

export default changelogFunctions
