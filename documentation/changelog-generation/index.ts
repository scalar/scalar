import { readFileSync, writeFileSync } from 'fs'

type change = {
  commitType:
    | 'feat'
    | 'fix'
    | 'chore'
    | 'refactor'
    | 'docs'
    | 'style'
    | 'test'
    | 'perf'
    | 'build'
    | 'ci'
    | 'revert'
    | 'other'
    | null
  commitHash: string
  commitMessage: string
  commitUrl: string
  pullRequestUrl: string
  pullRequestDescription: string
  pullRequestDiffContent?: string
  pullRequestSummary?: string
}

type dependency = {
  packageName: string
  version: string
}

type packageChangelog = {
  version: string | null
  changeType: 'patch' | 'minor' | 'major' | null
  changes: change[]
  dependencies: dependency[]
}

type changelog = {
  timestamp: string
  packageChangelogs: { [packageName: string]: packageChangelog }
}

type GitHubConfig = {
  token: string
  owner: string
  repo: string
}

/**
 * Formats the current date and time as "Month Day Hour:MinuteAM/PM"
 * Example: "January 15 2:30PM"
 */
function formatTimestamp(): string {
  const now = new Date()

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const month = months[now.getMonth()]
  const day = now.getDate()
  let hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'

  // Convert to 12-hour format
  hours = hours % 12
  hours = hours ? hours : 12 // 0 should be 12

  return `${month} ${day} ${hours}:${minutes}${ampm}`
}

/**
 * Fetches the pull request URL, description, diff URL, and files changed for a given commit hash using GitHub API.
 * Uses hardcoded API key and repository details.
 */
async function getPullRequestInfo(
  commitHash: string,
  config: GitHubConfig,
): Promise<{
  url: string
  description: string
  diffUrl: string
  diffContent?: string
}> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/commits/${commitHash}/pulls`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${config.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    )

    if (!response.ok) {
      return { url: '', description: '', diffUrl: '' }
    }

    const pulls = await response.json()
    if (pulls.length > 0) {
      const pr = pulls[0]

      // Get detailed PR info including files changed
      const prResponse = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/pulls/${pr.number}`, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${config.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      let diffContent: string | undefined

      if (prResponse.ok) {
        const prDetails = await prResponse.json()
        // Optionally get the actual diff content
        if (pr.diff_url) {
          const diffResponse = await fetch(pr.diff_url, {
            headers: {
              'Accept': 'application/vnd.github.diff',
              'Authorization': `Bearer ${config.token}`,
            },
          })

          if (diffResponse.ok) {
            diffContent = await diffResponse.text()
          }
        }
      }

      return {
        url: pr.html_url,
        description: pr.body || '',
        diffUrl: pr.diff_url || '',
        diffContent,
      }
    }

    return { url: '', description: '', diffUrl: '' }
  } catch (error) {
    return { url: '', description: '', diffUrl: '' }
  }
}

/**
 * Extracts the commit type from a commit message.
 * Looks for conventional commit format: type(scope): description
 */
function extractCommitType(
  commitMessage: string,
):
  | 'feat'
  | 'fix'
  | 'chore'
  | 'refactor'
  | 'docs'
  | 'style'
  | 'test'
  | 'perf'
  | 'build'
  | 'ci'
  | 'revert'
  | 'other'
  | null {
  // Match conventional commit format: type(scope): description
  const conventionalMatch = commitMessage.match(/^(\w+)(?:\([^)]+\))?:\s*(.+)/)
  if (conventionalMatch) {
    return conventionalMatch[1].toLowerCase() as any
  }

  return null
}

export async function parseChangelog(input: string, config: GitHubConfig): Promise<changelog> {
  const changelog: changelog = {
    timestamp: formatTimestamp(),
    packageChangelogs: {},
  }
  const lines = input.split(/\r?\n/)

  let currentPackageName: string | null = null

  for (const line of lines) {
    if (line.startsWith('## @')) {
      const packageSectionLine = line
      console.log(packageSectionLine)
      if (packageSectionLine) {
        const parts = packageSectionLine.split('@')
        const packageName = parts[1]
        const version = parts[2].split(' ')[0]
        currentPackageName = packageName
        changelog.packageChangelogs[packageName] = {
          version: version,
          changeType: null,
          changes: [],
          dependencies: [],
        }
      }
    }
    if (line.startsWith('###') && currentPackageName) {
      const versionType = line.split('###')[1].trim().toLowerCase()
      if (versionType) {
        changelog.packageChangelogs[currentPackageName].changeType = versionType as 'patch' | 'minor' | 'major' | null
      }
    }
    if (line.startsWith('-   ') && currentPackageName) {
      // Parse commit entries like: -   44aecdd: feat: set default \_integration to svelte
      const match = line.match(/^\s*-\s+([a-f0-9]{7}): (.+)/)
      if (match) {
        const [, commitHash, commitMessage] = match
        const commitUrl = `https://github.com/${config.owner}/${config.repo}/commit/${commitHash}`
        const commitType = extractCommitType(commitMessage)
        const {
          url: pullRequestUrl,
          description: pullRequestDescription,
          diffContent: pullRequestDiffContent,
        } = await getPullRequestInfo(commitHash, config)

        changelog.packageChangelogs[currentPackageName].changes.push({
          commitType,
          commitHash,
          commitMessage,
          commitUrl,
          pullRequestUrl,
          pullRequestDescription,
          pullRequestDiffContent,
        })
      }
    }
    if (line.startsWith('    -   ') && currentPackageName) {
      const parts = line.split('@')
      const packageName = parts[1]
      const version = parts[2].split(' ')[0]
      changelog.packageChangelogs[currentPackageName].dependencies.push({
        packageName,
        version,
      })
    }
  }
  return changelog
}
const content = readFileSync('input-2.md', 'utf-8')

// Parse changelog asynchronously
parseChangelog(content, {
  token: process.env.GITHUB_TOKEN || '',
  owner: 'scalar',
  repo: 'scalar',
})
  .then((jsonChangelog) => {
    // Write the parsed changelog to a JSON file
    writeFileSync('../changelog.json', JSON.stringify(jsonChangelog, null, 2), 'utf-8')
    console.log('Changelog JSON has been written to changelog.json')
  })
  .catch((error) => {
    console.error('Error parsing changelog:', error)
  })
