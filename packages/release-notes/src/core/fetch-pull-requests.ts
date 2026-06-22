/**
 * Pull request context fetched from the GitHub REST API.
 */
export type PullRequestSummary = {
  number: number
  title: string
  body: string
}

type FetchOptions = {
  /** PR numbers to fetch. Duplicates are deduplicated internally. */
  numbers: readonly number[]
  /** `owner/repo` slug. */
  repo: string
  /** Optional GitHub token. */
  token?: string
  /** Optional `fetch` injection for tests. */
  fetchImpl?: typeof fetch
}

const MAX_BODY_LENGTH = 4000

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Extract unique PR numbers from a Changesets-style CHANGELOG section.
 */
export const extractPullRequestNumbers = (markdown: string, repo?: string): number[] => {
  const found = new Set<number>()
  const repoPattern = repo
    ? `${escapeRegExp(repo)}\\/(?:pull|issues)\\/(\\d+)`
    : '[\\w.-]+\\/[\\w.-]+\\/(?:pull|issues)\\/(\\d+)'
  const pattern = new RegExp(`(?:${repoPattern})|#(\\d+)`, 'g')

  for (const match of markdown.matchAll(pattern)) {
    const raw = match[1] ?? match[2]
    if (!raw) {
      continue
    }
    const parsed = Number.parseInt(raw, 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      found.add(parsed)
    }
  }

  return [...found].sort((a, b) => a - b)
}

type GitHubPullRequestResponse = {
  number?: number
  title?: string
  body?: string | null
}

const truncateBody = (body: string): string => {
  const trimmed = body.trim()
  if (trimmed.length <= MAX_BODY_LENGTH) {
    return trimmed
  }
  return `${trimmed.slice(0, MAX_BODY_LENGTH)}\n\n[truncated]`
}

/**
 * Fetch PR titles and descriptions for every requested number.
 */
export const fetchPullRequests = async (options: FetchOptions): Promise<Map<number, PullRequestSummary>> => {
  const fetchImpl = options.fetchImpl ?? fetch
  const summaries = new Map<number, PullRequestSummary>()
  const unique = [...new Set(options.numbers)].filter((value) => Number.isFinite(value) && value > 0)

  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  }
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`
  }

  for (const number of unique) {
    try {
      const response = await fetchImpl(`https://api.github.com/repos/${options.repo}/pulls/${number}`, { headers })
      if (!response.ok) {
        console.warn(`Skipping PR #${number}: GitHub returned ${response.status}`)
        continue
      }
      const payload = (await response.json()) as GitHubPullRequestResponse
      const title = typeof payload.title === 'string' ? payload.title.trim() : ''
      const body = typeof payload.body === 'string' ? truncateBody(payload.body) : ''
      if (!title) {
        continue
      }
      summaries.set(number, { number, title, body })
    } catch (error) {
      console.warn(`Skipping PR #${number}: ${(error as Error).message}`)
    }
  }

  return summaries
}
