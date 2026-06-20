import type { ProductPromptContext, PromptOptions, ReleaseNotesProvider } from '../config/types'
import { type ReleaseNote, aiReleaseNoteSchema, buildReleaseNoteFromAiOutput } from '../types'
import type { PullRequestSummary } from './fetch-pull-requests'

export const DEFAULT_MAX_OUTPUT_TOKENS = 1024

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
  maxOutputTokens?: number
  signal?: AbortSignal
}

export const buildDefaultSystemPrompt = (product: ProductPromptContext): string => {
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
    'Inputs:',
    '- The CHANGELOG section is the source of truth for what changed in the released package.',
    '- "Dependency CHANGELOG" blocks may follow with sections from dependencies that ship inside this release. Treat their entries as user-facing changes that landed in the parent release.',
    '- A "Pull request context" block may follow with each PR\'s title and description. Use it to understand the why behind each entry, but do not invent details that are not supported by these inputs.',
    '',
    'Output format:',
    '- You MUST respond with a single JSON object and nothing else. No markdown fences, no commentary.',
    '- Keys only: version, title, description (optional), highlights (optional array, max 5). No other keys.',
    '- version must match the package version from the user message (semver string).',
    '- title is one short sentence (max ~80 chars).',
    '- description is one paragraph that sets context. Omit it when there is only one thing to say.',
    '- highlights are single-sentence bullet points. Omit when there are fewer than two interesting changes.',
  ].join('\n')
}

export const buildSystemPrompt = (options: { product: ProductPromptContext; prompts?: PromptOptions }): string => {
  return options.prompts?.systemPrompt?.({ product: options.product }) ?? buildDefaultSystemPrompt(options.product)
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

const parseProviderJson = (payload: unknown): unknown => {
  if (typeof payload === 'string') {
    const text = payload.trim()
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    const jsonText = (fenced?.[1] ?? text).trim()
    try {
      return JSON.parse(jsonText) as unknown
    } catch (error) {
      throw new Error(`AI provider returned invalid JSON: ${(error as Error).message}\nRaw text:\n${jsonText}`)
    }
  }
  return payload
}

/**
 * Turn changelog context into a validated release note with a pluggable provider.
 */
export const generateReleaseNote = async (options: GenerateReleaseNoteOptions): Promise<ReleaseNote> => {
  const product = options.product ?? {
    displayName: options.packageName,
    description: options.prompts?.productDescriptionFallback ?? 'an open-source package',
  }
  const raw = await options.provider.generateJson({
    model: options.model ?? options.provider.defaultModel,
    systemPrompt: buildSystemPrompt({ product, prompts: options.prompts }),
    userPrompt: buildUserPrompt(options),
    schema: aiReleaseNoteSchema,
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    signal: options.signal,
  })
  const parsed = parseProviderJson(raw)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`AI provider returned JSON that is not an object.\nPayload:\n${JSON.stringify(parsed, null, 2)}`)
  }

  const aiResult = aiReleaseNoteSchema.safeParse(parsed)
  if (!aiResult.success) {
    throw new Error(
      `AI-generated release note failed validation:\n${aiResult.error.message}\nPayload:\n${JSON.stringify(parsed, null, 2)}`,
    )
  }

  return buildReleaseNoteFromAiOutput(aiResult.data, {
    version: options.version,
    date: options.date,
    href: options.releaseUrl,
  })
}
