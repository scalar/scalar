import type { ProductPromptContext, PromptOptions, ReleaseNotesProvider } from '../config/types'
import {
  DEFAULT_MAX_HIGHLIGHTS,
  type ReleaseNote,
  buildReleaseNoteFromAiOutput,
  createAiReleaseNoteSchema,
} from '../types'
import type { PullRequestSummary } from './fetch-pull-requests'

const DEFAULT_MAX_OUTPUT_TOKENS = 1024

/**
 * Pick an output token budget that leaves room for every highlight the schema allows. A note with
 * the full number of highlights, each near the 280-character limit, plus the title and description,
 * would otherwise be cut off mid-JSON for larger limits, and a truncated response can never pass
 * validation however many times it is retried. The default limit keeps the original 1024 budget.
 */
const getDefaultMaxOutputTokens = (maxHighlights: number): number =>
  Math.max(DEFAULT_MAX_OUTPUT_TOKENS, 256 + maxHighlights * 128)

/**
 * How many times to ask the provider for a note before giving up. The output
 * is non-deterministic, so a single run occasionally trips a schema limit
 * (for example a highlight that runs past 280 characters). Rather than
 * hard-failing the release pipeline on a cosmetic slip, we feed the
 * validation error back to the provider and let it correct itself.
 */
const MAX_ATTEMPTS = 3

/**
 * One CHANGELOG section pulled from a dependency that ships inside the release.
 */
export type DependencyChangelog = {
  packageName: string
  version: string
  changelogSection: string
}

export type GenerateReleaseNoteOptions = {
  packageName: string
  version: string
  date: string
  changelogSection: string
  releaseUrl: string
  provider: ReleaseNotesProvider
  model?: string
  product?: ProductPromptContext
  prompts?: PromptOptions
  dependencyChangelogs?: readonly DependencyChangelog[]
  pullRequests?: ReadonlyMap<number, PullRequestSummary>
  /**
   * The most highlights the generated note may carry, from 1 to 20. Defaults to 5. Enforced by the
   * response schema and stated in the default system prompt.
   */
  maxHighlights?: number
  /** Output token budget for each provider call. Defaults to a budget sized for `maxHighlights`. */
  maxOutputTokens?: number
  signal?: AbortSignal
}

/**
 * Build the system prompt the generator uses when no custom prompt is configured. A custom prompt
 * that builds on this one should forward the `maxHighlights` it receives in its context, so the
 * limit the model is told matches the limit its response is validated against.
 */
export const buildDefaultSystemPrompt = (
  product: ProductPromptContext,
  options: { includePullRequestContext?: boolean; maxHighlights?: number } = {},
): string => {
  const maxHighlights = options.maxHighlights ?? DEFAULT_MAX_HIGHLIGHTS
  const inputs = [
    'Inputs:',
    '- The CHANGELOG section is the source of truth for what changed in the released package.',
    '- "Dependency CHANGELOG" blocks may follow with sections from dependencies that ship inside this release. Treat their entries as user-facing changes that landed in the parent release.',
  ]

  // Only advertise the pull request block when the prompt actually carries one.
  if (options.includePullRequestContext !== false) {
    inputs.push(
      '- A "Pull request context" block may follow with each PR\'s title and description. Use it to understand the why behind each entry, but do not invent details that are not supported by these inputs.',
    )
  }

  return [
    `You write release notes for ${product.displayName} - ${product.description}.`,
    'You are summarising a Changesets-style CHANGELOG section for users reading curated release notes.',
    '',
    'Tone and style:',
    '- Friendly, human, Linear / Vercel-like.',
    '- Do not use contractions (write "do not", not "don\'t").',
    '- Sentence case for the title. No exclamation marks.',
    '- Talk about user-facing changes only. Skip refactors, dependency bumps, internal CI changes, and chores.',
    '- If every entry is a chore or dependency bump, return a single short note that says polish and bug fixes shipped.',
    '',
    ...inputs,
    '',
    'Output format:',
    '- You MUST respond with a single JSON object and nothing else. No markdown fences, no commentary.',
    `- Keys only: version, title, description (optional), highlights (optional array, max ${maxHighlights}). No other keys.`,
    '- version must match the package version from the user message (semver string).',
    '- title is one short sentence (max 120 characters).',
    '- description is one paragraph that sets context (max 500 characters). Omit it when there is only one thing to say.',
    `- highlights are single-sentence bullet points (at most ${maxHighlights}, each max 280 characters). Keep each one short and split a long highlight into two rather than letting it run over. Omit the array when there are fewer than two interesting changes.`,
  ].join('\n')
}

export const buildSystemPrompt = (options: {
  product: ProductPromptContext
  prompts?: PromptOptions
  includePullRequestContext?: boolean
  maxHighlights?: number
}): string => {
  const includePullRequestContext = options.includePullRequestContext !== false
  const maxHighlights = options.maxHighlights ?? DEFAULT_MAX_HIGHLIGHTS

  return (
    options.prompts?.systemPrompt?.({ product: options.product, includePullRequestContext, maxHighlights }) ??
    buildDefaultSystemPrompt(options.product, { includePullRequestContext, maxHighlights })
  )
}

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
    'Dependency CHANGELOG sections (changes from dependencies that ship inside this release):',
    '',
    ...blocks,
  ].join('\n')
}

export const buildUserPrompt = (
  options: Pick<
    GenerateReleaseNoteOptions,
    'packageName' | 'version' | 'date' | 'changelogSection' | 'releaseUrl' | 'pullRequests' | 'dependencyChangelogs'
  >,
): string => {
  const sections: string[] = [
    `Package: ${options.packageName}`,
    `Version: ${options.version}`,
    `Date: ${options.date}`,
    `Release URL (for maintainers only - do not include this in your JSON): ${options.releaseUrl}`,
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

type AiReleaseNoteSchema = ReturnType<typeof createAiReleaseNoteSchema>

const parseProviderJson = (payload: unknown): unknown => {
  if (typeof payload === 'string') {
    const text = payload.trim()
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonText = (fenced?.[1] ?? text).trim()
    try {
      return JSON.parse(jsonText)
    } catch (error) {
      throw new Error(
        `AI provider returned invalid JSON: ${error instanceof Error ? error.message : String(error)}\nRaw text:\n${jsonText}`,
      )
    }
  }
  return payload
}

/**
 * Parse and validate one provider response. Returns the validated payload on
 * success, or a structured failure carrying both a terse `feedback` line to
 * send back to the provider on the next attempt and the verbose `fatalError`
 * to surface if we run out of attempts.
 */
const validateProviderResponse = (
  raw: unknown,
  schema: AiReleaseNoteSchema,
):
  | { ok: true; data: ReturnType<AiReleaseNoteSchema['parse']> }
  | { ok: false; feedback: string; fatalError: Error } => {
  let parsed: unknown
  try {
    parsed = parseProviderJson(raw)
  } catch (error) {
    return {
      ok: false,
      feedback: `Your previous response was not valid JSON (${error instanceof Error ? error.message : String(error)}). Respond with a single valid JSON object and nothing else.`,
      fatalError: error instanceof Error ? error : new Error(String(error)),
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      ok: false,
      feedback: 'Your previous response was not a JSON object. Respond with a single JSON object and nothing else.',
      fatalError: new Error(
        `AI provider returned JSON that is not an object.\nPayload:\n${JSON.stringify(parsed, null, 2)}`,
      ),
    }
  }

  const aiResult = schema.safeParse(parsed)
  if (!aiResult.success) {
    return {
      ok: false,
      feedback: `Your previous response failed validation:\n${aiResult.error.message}\nReturn a corrected JSON object that satisfies every constraint. Respond with the JSON object only.`,
      fatalError: new Error(
        `AI-generated release note failed validation:\n${aiResult.error.message}\nPayload:\n${JSON.stringify(parsed, null, 2)}`,
      ),
    }
  }

  return { ok: true, data: aiResult.data }
}

/**
 * Turn changelog context into a validated release note with a pluggable provider.
 *
 * The provider output is non-deterministic, so a single run occasionally trips
 * a schema limit (for example a highlight that runs past 280 characters).
 * Rather than hard-failing the release pipeline on a cosmetic slip, we feed the
 * previous output and the validation error back into the prompt and retry up to
 * `MAX_ATTEMPTS` times.
 */
export const generateReleaseNote = async (options: GenerateReleaseNoteOptions): Promise<ReleaseNote> => {
  const product = options.product ?? {
    displayName: options.packageName,
    description: options.prompts?.productDescriptionFallback ?? 'an open-source package',
  }
  const maxHighlights = options.maxHighlights ?? DEFAULT_MAX_HIGHLIGHTS
  // Built before any provider call, so an out-of-range limit fails fast instead of after a paid request.
  const schema = createAiReleaseNoteSchema(maxHighlights)
  const includePullRequestContext = (options.pullRequests?.size ?? 0) > 0
  const systemPrompt = buildSystemPrompt({
    product,
    prompts: options.prompts,
    includePullRequestContext,
    maxHighlights,
  })
  const baseUserPrompt = buildUserPrompt(options)

  let userPrompt = baseUserPrompt

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await options.provider.generateJson({
      model: options.model ?? options.provider.defaultModel,
      systemPrompt,
      userPrompt,
      schema,
      maxOutputTokens: options.maxOutputTokens ?? getDefaultMaxOutputTokens(maxHighlights),
      signal: options.signal,
    })

    const result = validateProviderResponse(raw, schema)
    if (result.ok) {
      return buildReleaseNoteFromAiOutput(result.data, {
        version: options.version,
        date: options.date,
        href: options.releaseUrl,
      })
    }

    if (attempt >= MAX_ATTEMPTS) {
      throw result.fatalError
    }

    // Feed the previous output and failure back so the next attempt can self-correct.
    console.warn(`Release note attempt ${attempt} failed validation; retrying with feedback.`)
    const previousOutput = typeof raw === 'string' ? raw : JSON.stringify(raw)
    userPrompt = [baseUserPrompt, '', 'Your previous response was:', previousOutput, '', result.feedback].join('\n')
  }

  // Unreachable: the loop either returns a note or throws on the final attempt.
  throw new Error('Failed to generate a release note after exhausting all attempts.')
}
