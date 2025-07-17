import { readFileSync, writeFileSync } from 'fs'

/**
 * Represents a single change in the changelog.
 * Contains commit information and associated pull request details.
 */
type Change = {
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
  isDep: boolean
}

/**
 * Represents a dependency update with package name and version.
 */
type Dependency = {
  packageName: string
  version: string
}

/**
 * Represents the changelog for a specific package.
 * Contains version information, change type, and all changes.
 */
type PackageChangelog = {
  version: string | null
  changeType: 'patch' | 'minor' | 'major' | null
  changes: Change[]
  dependencies: Dependency[]
}

/**
 * Represents the complete changelog structure.
 * Contains timestamp and changelogs for all packages.
 */
type Changelog = {
  timestamp: string
  packageChangelogs: { [packageName: string]: PackageChangelog }
}

/**
 * Configuration for GitHub API access.
 * Should be set via environment variables in production.
 */
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
 * Uses configuration object for API access details.
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
    const commitType = conventionalMatch[1].toLowerCase()

    // Validate the commit type against our allowed types
    const validTypes = [
      'feat',
      'fix',
      'chore',
      'refactor',
      'docs',
      'style',
      'test',
      'perf',
      'build',
      'ci',
      'revert',
    ] as const

    if (validTypes.includes(commitType as any)) {
      return commitType as (typeof validTypes)[number]
    }

    return 'other'
  }

  return null
}

/**
 * Finds the actual commit message for a given commit hash by searching through the file content.
 * Looks for lines like: -   commitHash: actual commit message
 */
function findActualCommitMessage(fileContent: string, commitHash: string): string | null {
  const lines = fileContent.split(/\r?\n/)

  for (const line of lines) {
    // Look for lines that start with the commit hash followed by a colon
    const match = line.match(/^\s*-\s+([a-f0-9]{7}):\s*(.+)/)
    if (match && match[1] === commitHash) {
      return match[2]
    }
  }

  return null
}

export async function parseChangelog(input: string, config: GitHubConfig): Promise<Changelog> {
  const changelog: Changelog = {
    timestamp: formatTimestamp(),
    packageChangelogs: {},
  }
  const lines = input.split(/\r?\n/)

  let currentPackageName: string | null = null

  for (const line of lines) {
    if (line.startsWith('## @')) {
      const packageSectionLine = line
      if (packageSectionLine) {
        const parts = packageSectionLine.split('@')
        if (parts.length >= 2) {
          const packageName = parts[1]
          const version = parts[2]?.split(' ')[0] || null
          currentPackageName = packageName
          changelog.packageChangelogs[packageName] = {
            version: version,
            changeType: null,
            changes: [],
            dependencies: [],
          }
        }
      }
    }
    if (line.startsWith('###') && currentPackageName) {
      const versionType = line.split('###')[1]?.trim().toLowerCase()
      if (versionType && ['patch', 'minor', 'major'].includes(versionType)) {
        changelog.packageChangelogs[currentPackageName].changeType = versionType as 'patch' | 'minor' | 'major'
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
          isDep: false,
        })
      }
    }
    if (line.startsWith('-   Updated dependencies') && currentPackageName) {
      // Parse dependency line like: -   Updated dependencies [a04cc15]
      const match = line.match(/^\s*-\s+Updated dependencies \[([a-f0-9]{7})\]/)
      if (match) {
        const [, commitHash] = match
        let commitMessage = 'Updated dependencies'

        // Try to find the actual commit message for this hash
        const actualCommitMessage = findActualCommitMessage(input, commitHash)
        if (actualCommitMessage) {
          commitMessage = actualCommitMessage
        }

        const commitType = extractCommitType(commitMessage)
        const commitUrl = `https://github.com/${config.owner}/${config.repo}/commit/${commitHash}`
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
          isDep: true,
        })
      }
    }
  }
  return changelog
}
const content = readFileSync('input.md', 'utf-8')

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
