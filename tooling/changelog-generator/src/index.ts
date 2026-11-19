import { getCommitInfo } from '@changesets/get-github-info'
import type { ChangelogFunctions } from '@changesets/types'

import { formatReleaseLine } from './formatter'
import type { GitHubInfo } from './types'

type Options = Partial<{ repo?: string }> | null

const changelogFunctions: ChangelogFunctions = {
  getReleaseLine: async (changeset, _type, options: Options): Promise<string> => {
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
    const commitInfo = changeset.commit
      ? await getCommitInfo({
          repo,
          commit: changeset.commit,
        })
      : null

    const githubInfo: GitHubInfo | null = commitInfo
      ? {
          user: commitInfo.author?.login ?? null,
          pull: commitInfo.pull?.number ?? null,
          links: {
            commit: commitInfo.commit.url,
            pull: commitInfo.pull?.url ?? null,
            user: commitInfo.author?.url ?? null,
          },
        }
      : null

    // Use PR from GitHub info if available, otherwise fall back to summary
    const prNumber = githubInfo?.pull ?? prFromSummary

    // Create a GitHub info object with PR link
    const summaryInfo = prNumber
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
    const githubInfoWithPR = githubInfo
      ? {
          ...githubInfo,
          pull: prNumber || githubInfo.pull,
          links: {
            ...githubInfo.links,
            pull: prNumber ? `https://github.com/${repo}/pull/${prNumber}` : githubInfo.links.pull,
          },
        }
      : summaryInfo

    return formatReleaseLine(changeset, githubInfoWithPR)
  },

  getDependencyReleaseLine: async (_changesets, _dependenciesUpdated, _options: Options): Promise<string> => {
    // This hook has no consumer context. Bundle versions are added by the release wrapper instead.
    return await Promise.resolve('')
  },
}

export default changelogFunctions
