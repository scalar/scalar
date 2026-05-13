/**
 * Pull request context fetched from the GitHub REST API. We only keep
 * the fields we feed into the model prompt - title and body - so the
 * shape is intentionally tiny.
 */
export type PullRequestSummary = {
  number: number
  title: string
  body: string
}

type FetchOptions = {
  /** PR numbers to fetch. Duplicates are deduplicated by the caller. */
  numbers: readonly number[]
  /** `owner/repo` slug. Defaults to `scalar/scalar`. */
  repo?: string
  /**
   * Optional GitHub token. Public repos work without one but the
   * unauthenticated rate limit (60/hour/IP) is easy to blow through in
   * CI - pass `GITHUB_TOKEN` whenever it is available.
   */
  token?: string
  /** Optional `fetch` injection for tests. */
  fetchImpl?: typeof fetch
}

/**
 * Hard cap on PR body length. PR descriptions can be enormous (release
 * checklists, screenshots, log dumps) and the input window is shared
 * across every PR in the section, so we truncate aggressively. The
 * first ~4 KB usually contains the human-written summary, which is the
 * only part that helps the model.
 */
const MAX_BODY_LENGTH = 4000

/**
 * Default repo slug. Hardcoded because the CI flow only ever runs this
 * generator against `scalar/scalar`. Override via `repo` in tests.
 */
const DEFAULT_REPO = 'scalar/scalar'

/**
 * Extract unique PR numbers from a Changesets-style CHANGELOG section.
 *
 * Changesets writes each entry as `- [#9049](https://github.com/scalar/scalar/pull/9049): ...`
 * (and sometimes plain `#9049` references). We accept both shapes so we
 * never miss a PR even if the formatting drifts.
 *
 * Returned numbers are sorted ascending and deduplicated - the same PR
 * can land in both a Minor Changes and Patch Changes block within one
 * release.
 */
export const extractPullRequestNumbers = (markdown: string): number[] => {
  const found = new Set<number>()
  const pattern = /(?:scalar\/scalar\/(?:pull|issues)\/(\d+))|#(\d+)/g
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
 *
 * Errors are intentionally swallowed per-PR: a missing or rate-limited
 * response should degrade the prompt back to "CHANGELOG-only" rather
 * than fail the release pipeline. The returned `Map` only contains the
 * PRs that succeeded.
 */
export const fetchPullRequests = async (options: FetchOptions): Promise<Map<number, PullRequestSummary>> => {
  const fetchImpl = options.fetchImpl ?? fetch
  const repo = options.repo ?? DEFAULT_REPO
  const summaries = new Map<number, PullRequestSummary>()
  const unique = [...new Set(options.numbers)].filter((value) => Number.isFinite(value) && value > 0)

  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  }
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`
  }

  // Sequential on purpose: we are fetching at most a handful of PRs per
  // release and the polite-traffic story is simpler than juggling a
  // Promise.all that may partially fail.
  for (const number of unique) {
    try {
      const response = await fetchImpl(`https://api.github.com/repos/${repo}/pulls/${number}`, { headers })
      if (!response.ok) {
        console.warn(`Skipping PR #${number}: GitHub returned ${response.status}`)
        continue
      }
      const payload = (await response.json()) as GitHubPullRequestResponse
      const title = typeof payload.title === 'string' ? payload.title.trim() : ''
      const body = typeof payload.body === 'string' ? truncateBody(payload.body) : ''
      if (!title) {
        // A PR without a title is almost certainly a malformed response.
        // Skip rather than feed an empty stub into the prompt.
        continue
      }
      summaries.set(number, { number, title, body })
    } catch (error) {
      console.warn(`Skipping PR #${number}: ${(error as Error).message}`)
    }
  }

  return summaries
}
