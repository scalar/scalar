import type { PullRequestSummary } from './fetch-pull-requests'
import { type ReleaseNote, releaseNoteSchema } from './types'

/**
 * URL of the Anthropic Messages API. Pinned to a specific version so a
 * future API revision cannot silently change the response shape under us.
 */
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'

/**
 * Default model used when `--model` is not provided. We pick the smaller
 * Sonnet variant on purpose: the input is a tiny CHANGELOG section, the
 * output is a constrained JSON object, and we run this once per release -
 * paying for a frontier model would be wasteful.
 */
const DEFAULT_MODEL = 'claude-sonnet-4-5'

/**
 * Hard cap on the response size. The schema limits each field anyway,
 * but we want the API call itself to fail fast if the model goes off the
 * rails.
 */
const MAX_OUTPUT_TOKENS = 1024

/**
 * One CHANGELOG section pulled from an internal dependency that ships
 * inside the release we are summarising. Used to give the model context
 * about every user-facing change that landed in the parent package even
 * when the change technically lives in a sub-package.
 */
export type DependencyChangelog = {
  /** NPM package name of the dependency (for example `@scalar/api-client`). */
  packageName: string
  /** Version of the dependency that landed in this release. */
  version: string
  /** Raw CHANGELOG.md section for that version. */
  changelogSection: string
}

type GenerateOptions = {
  /** NPM package name of the release being summarised (for example `scalar-app`). */
  packageName: string
  /** Semver-style version string for the release being summarised. */
  version: string
  /** ISO `YYYY-MM-DD` release date. */
  date: string
  /** Raw CHANGELOG.md section for the release (input to the model). */
  changelogSection: string
  /** GitHub release URL used as the `href` in the generated note. */
  releaseUrl: string
  /** Anthropic API key. Read from `ANTHROPIC_API_KEY` by the caller. */
  apiKey: string
  /** Optional model override. Defaults to `DEFAULT_MODEL`. */
  model?: string
  /**
   * CHANGELOG sections from internal dependencies whose changes ship
   * inside the parent release. The output still reads as a single release
   * note for the parent package, but the model treats these entries as
   * additional user-facing changes that landed in this version. Optional.
   */
  dependencyChangelogs?: readonly DependencyChangelog[]
  /**
   * Pull request titles and descriptions referenced from the CHANGELOG
   * section. Used to give the model the human-written context behind
   * each entry instead of just the one-line commit subject. Optional -
   * the prompt still works without it, but the resulting note tends to
   * be vaguer.
   */
  pullRequests?: ReadonlyMap<number, PullRequestSummary>
  /** Optional `fetch` injection for tests. */
  fetchImpl?: typeof fetch
}

/**
 * Build the system prompt. Pulled out of `generateReleaseNote` so we can
 * unit-test the wording without a live API call.
 *
 * The tone instructions intentionally mirror the existing curated entries
 * in `projects/scalar-app/RELEASE_NOTES.md` and Scalar's house style
 * (no contractions, friendly, user-facing).
 */
export const buildSystemPrompt = (): string => {
  return [
    'You write release notes for the Scalar API Client - a Vue-based open-source API testing client.',
    'You are summarising a Changesets-style CHANGELOG section for the modal that users see inside the product.',
    '',
    'Tone and style:',
    '- Friendly, human, Linear / Vercel-like.',
    '- Do not use contractions (write "do not", not "don\'t").',
    '- Sentence case for the title. No exclamation marks.',
    '- Talk about user-facing changes only. Skip refactors, dependency bumps, internal CI changes, and chores.',
    '- If every entry is a chore or dependency bump, return a single short note that says polish and bug fixes shipped.',
    '',
    'Inputs:',
    '- The CHANGELOG section is the source of truth for what changed in the released package.',
    '- "Dependency CHANGELOG" blocks may follow with sections from internal dependencies that ship inside this release. Treat their entries as user-facing changes that landed in the parent release - the output is still a single release note for the parent package, not a per-dependency rollup.',
    '- A "Pull request context" block may follow with each PR\'s title and description. Use it to understand the why behind each entry, but do not invent details that are not supported by these inputs.',
    '',
    'Output format:',
    '- You MUST respond with a single JSON object and nothing else. No markdown fences, no commentary.',
    '- Keys: version, date, title, description (optional), highlights (optional array, max 5), href.',
    '- title is one short sentence (max ~80 chars).',
    '- description is one paragraph that sets context. Omit it when there is only one thing to say.',
    '- highlights are single-sentence bullet points. Omit when there are fewer than two interesting changes.',
  ].join('\n')
}

/**
 * Render the per-PR context block. Each PR shows up once with its
 * title and (truncated) body so the model can ground each CHANGELOG
 * line in the actual human-written description rather than just the
 * commit subject.
 *
 * Exported so the prompt content is testable without a live API call.
 */
export const buildPullRequestContext = (pullRequests: ReadonlyMap<number, PullRequestSummary> | undefined): string => {
  if (!pullRequests || pullRequests.size === 0) {
    return ''
  }
  const ordered = [...pullRequests.values()].sort((a, b) => a.number - b.number)
  const blocks = ordered.map((pr) => {
    const body = pr.body.length > 0 ? pr.body : '(no description)'
    return [`### PR #${pr.number}: ${pr.title}`, '', body].join('\n')
  })
  return ['Pull request context (titles and descriptions for each PR referenced above):', '', ...blocks].join('\n')
}

/**
 * Render the dependency CHANGELOG context blocks. Each entry shows up as
 * its own labelled markdown section so the model can tell which sub
 * package each change belongs to even though the output describes a
 * single parent release.
 *
 * Exported so the prompt content is testable without a live API call.
 */
export const buildDependencyChangelogContext = (
  dependencyChangelogs: readonly DependencyChangelog[] | undefined,
): string => {
  if (!dependencyChangelogs || dependencyChangelogs.length === 0) {
    return ''
  }
  const blocks = dependencyChangelogs.map((entry) => {
    return [
      `### Dependency CHANGELOG: ${entry.packageName}@${entry.version}`,
      '',
      '```markdown',
      entry.changelogSection,
      '```',
    ].join('\n')
  })
  return [
    'Dependency CHANGELOG sections (changes from internal dependencies that ship inside this release):',
    '',
    ...blocks,
  ].join('\n')
}

const buildUserPrompt = (
  options: Pick<
    GenerateOptions,
    'packageName' | 'version' | 'date' | 'changelogSection' | 'releaseUrl' | 'pullRequests' | 'dependencyChangelogs'
  >,
): string => {
  const sections: string[] = [
    `Package: ${options.packageName}`,
    `Version: ${options.version}`,
    `Date: ${options.date}`,
    `Release URL (use as the "href" field): ${options.releaseUrl}`,
    '',
    `CHANGELOG section for ${options.packageName}@${options.version}:`,
    '```markdown',
    options.changelogSection,
    '```',
  ]

  const dependencyContext = buildDependencyChangelogContext(options.dependencyChangelogs)
  if (dependencyContext) {
    sections.push('', dependencyContext)
  }

  const pullRequestContext = buildPullRequestContext(options.pullRequests)
  if (pullRequestContext) {
    sections.push('', pullRequestContext)
  }

  sections.push('', 'Return ONLY the JSON object.')
  return sections.join('\n')
}

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>
  error?: { message?: string }
}

const extractJsonText = (response: AnthropicResponse): string => {
  const block = response.content?.find((entry) => entry.type === 'text' && typeof entry.text === 'string')
  const text = block?.text?.trim() ?? ''
  if (!text) {
    throw new Error('Anthropic response did not include any text content')
  }
  // Defensive: strip a stray ```json fence if the model adds one despite
  // the system prompt asking it not to. Cheap insurance against schema
  // failures we have seen in practice.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  return (fenced?.[1] ?? text).trim()
}

/**
 * Call the Anthropic Messages API to turn a CHANGELOG section into a
 * polished `ReleaseNote`. Validates the response against the shared Zod
 * schema and throws when the model returns something we cannot trust.
 */
export const generateReleaseNote = async (options: GenerateOptions): Promise<ReleaseNote> => {
  const fetchImpl = options.fetchImpl ?? fetch
  const model = options.model ?? DEFAULT_MODEL

  const response = await fetchImpl(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': options.apiKey,
      'anthropic-version': ANTHROPIC_API_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt({
            packageName: options.packageName,
            version: options.version,
            date: options.date,
            changelogSection: options.changelogSection,
            releaseUrl: options.releaseUrl,
            pullRequests: options.pullRequests,
            dependencyChangelogs: options.dependencyChangelogs,
          }),
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Anthropic API call failed (${response.status}): ${detail}`)
  }

  const payload = (await response.json()) as AnthropicResponse
  if (payload.error?.message) {
    throw new Error(`Anthropic API returned an error: ${payload.error.message}`)
  }

  const jsonText = extractJsonText(payload)
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (error) {
    throw new Error(`Anthropic returned invalid JSON: ${(error as Error).message}\nRaw text:\n${jsonText}`)
  }

  // Stamp version, date, and href so the model cannot drift even if it
  // tries - these are facts we already know on the CI side.
  const merged = {
    ...(typeof parsed === 'object' && parsed !== null ? parsed : {}),
    version: options.version,
    date: options.date,
    href: options.releaseUrl,
  }

  const result = releaseNoteSchema.safeParse(merged)
  if (!result.success) {
    throw new Error(
      `Generated release note failed validation:\n${result.error.message}\nPayload:\n${JSON.stringify(merged, null, 2)}`,
    )
  }

  return result.data
}
