import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, posix, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'

import { Command } from 'commander'

const execFileAsync = promisify(execFile)

type PackageJson = {
  name?: string
  version?: string
}

type ChangelogEntry = {
  version: string
  date: string
  title: string
  summary: string
  highlights: string[]
  source: {
    packageName: string
    packageDir: string
    previousVersion: string | null
    sinceCommit: string | null
  }
}

type ReleaseContext = {
  packageName: string
  packageDir: string
  title: string
  version: string
  previousVersion: string | null
  sinceCommit: string | null
  currentReleaseDiff: string
  committedReleaseLog: string
  committedChangelogDiff: string
}

type Options = {
  packageDir: string
  output?: string
  packageName?: string
  title?: string
  allowMissing?: boolean
  dryRun?: boolean
  mockResponse?: string
  model?: string
  baseUrl?: string
}

const MAX_CONTEXT_CHARS = 60_000
const VERSION_HEADING_PREFIX = '## '

const toGitPath = (path: string): string => path.split(sep).join(posix.sep)

const truncate = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}\n\n[truncated]` : text

const runGit = async (args: string[], cwd: string): Promise<string> => {
  const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 20 * 1024 * 1024 })
  return stdout.toString().trim()
}

const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, 'utf8')) as T

const readPackageJsonAtRef = async (
  repoRoot: string,
  packageJsonPath: string,
  ref: string,
): Promise<PackageJson | null> => {
  try {
    const contents = await runGit(['show', `${ref}:${packageJsonPath}`], repoRoot)
    return JSON.parse(contents) as PackageJson
  } catch {
    return null
  }
}

const getVersionAtRef = async (repoRoot: string, packageJsonPath: string, ref: string): Promise<string | null> => {
  const packageJson = await readPackageJsonAtRef(repoRoot, packageJsonPath, ref)
  return packageJson?.version ?? null
}

const findPreviousPackageReleaseCommit = async (
  repoRoot: string,
  packageJsonPath: string,
  previousVersion: string | null,
): Promise<string | null> => {
  if (!previousVersion) {
    return null
  }

  const commits = (await runGit(['log', '--format=%H', '--', packageJsonPath], repoRoot)).split('\n').filter(Boolean)

  for (const commit of commits) {
    const version = await getVersionAtRef(repoRoot, packageJsonPath, commit)
    if (version !== previousVersion) {
      continue
    }

    const parentVersion = await getVersionAtRef(repoRoot, packageJsonPath, `${commit}^`)
    if (parentVersion !== previousVersion) {
      return commit
    }
  }

  return null
}

const getCurrentReleaseDiff = async (repoRoot: string, packageDir: string): Promise<string> => {
  try {
    return await runGit(['diff', '--unified=20', '--', packageDir, '.changeset'], repoRoot)
  } catch {
    return ''
  }
}

const getCommittedReleaseLog = async (repoRoot: string, sinceCommit: string | null): Promise<string> => {
  const args = sinceCommit
    ? ['log', '--date=short', '--pretty=format:%h %ad %s', `${sinceCommit}..HEAD`]
    : ['log', '--date=short', '--pretty=format:%h %ad %s', '-n', '100']

  try {
    return await runGit(args, repoRoot)
  } catch {
    return ''
  }
}

const getCommittedChangelogDiff = async (repoRoot: string, sinceCommit: string | null): Promise<string> => {
  if (!sinceCommit) {
    return ''
  }

  try {
    return await runGit(['diff', '--unified=0', `${sinceCommit}..HEAD`, '--', ':(glob)**/CHANGELOG.md'], repoRoot)
  } catch {
    return ''
  }
}

export const collectReleaseContext = async (repoRoot: string, options: Options): Promise<ReleaseContext | null> => {
  const packageDir = toGitPath(relative(repoRoot, resolve(repoRoot, options.packageDir)))
  const packageJsonPath = join(packageDir, 'package.json')

  let packageJson: PackageJson
  try {
    packageJson = await readJson<PackageJson>(resolve(repoRoot, packageJsonPath))
  } catch (error) {
    if (options.allowMissing) {
      return null
    }

    throw error
  }

  const version = packageJson.version
  if (!version) {
    throw new Error(`${packageJsonPath} must include a version`)
  }

  const previousPackageJson = await readPackageJsonAtRef(repoRoot, packageJsonPath, 'HEAD')
  const previousVersion = previousPackageJson?.version ?? null

  if (previousVersion === version) {
    return null
  }

  const packageName = options.packageName ?? packageJson.name ?? basename(packageDir)
  const sinceCommit = await findPreviousPackageReleaseCommit(repoRoot, packageJsonPath, previousVersion)
  const currentReleaseDiff = await getCurrentReleaseDiff(repoRoot, packageDir)
  const committedReleaseLog = await getCommittedReleaseLog(repoRoot, sinceCommit)
  const committedChangelogDiff = await getCommittedChangelogDiff(repoRoot, sinceCommit)

  return {
    packageName,
    packageDir,
    title: options.title ?? packageName,
    version,
    previousVersion,
    sinceCommit,
    currentReleaseDiff: truncate(currentReleaseDiff, MAX_CONTEXT_CHARS),
    committedReleaseLog: truncate(committedReleaseLog, MAX_CONTEXT_CHARS),
    committedChangelogDiff: truncate(committedChangelogDiff, MAX_CONTEXT_CHARS),
  }
}

const buildPrompt = (
  context: ReleaseContext,
  date: string,
): string => `Write a user-facing changelog entry for ${context.title}.

Return strict JSON with this exact shape:
{
  "title": "short human headline",
  "summary": "one concise paragraph, 1-2 sentences",
  "highlights": ["2-5 concise bullets"]
}

Rules:
- Write for product users, not maintainers.
- Mention the most important shipped behavior since ${context.packageName} was last released.
- Combine the current release with package releases that landed since the previous ${context.packageName} release.
- Do not mention commits, hashes, internal package names, dependency bumps, CI, or release process details.
- Do not invent features that are not supported by the context.
- Today is ${date}.

Package:
${JSON.stringify(
  {
    name: context.packageName,
    dir: context.packageDir,
    version: context.version,
    previousVersion: context.previousVersion,
    sinceCommit: context.sinceCommit,
  },
  null,
  2,
)}

Current release diff:
${context.currentReleaseDiff || '[none]'}

Committed releases since the previous package release:
${context.committedReleaseLog || '[none]'}

Changelog diffs since the previous package release:
${context.committedChangelogDiff || '[none]'}
`

const parseModelResponse = (text: string, context: ReleaseContext, date: string): ChangelogEntry => {
  const parsed = JSON.parse(text) as Partial<Pick<ChangelogEntry, 'title' | 'summary' | 'highlights'>>

  if (typeof parsed.title !== 'string' || parsed.title.trim() === '') {
    throw new Error('LLM changelog response must include a title')
  }

  if (typeof parsed.summary !== 'string' || parsed.summary.trim() === '') {
    throw new Error('LLM changelog response must include a summary')
  }

  if (
    !Array.isArray(parsed.highlights) ||
    parsed.highlights.length === 0 ||
    !parsed.highlights.every((highlight) => typeof highlight === 'string' && highlight.trim() !== '')
  ) {
    throw new Error('LLM changelog response must include at least one highlight')
  }

  return {
    version: context.version,
    date,
    title: parsed.title.trim(),
    summary: parsed.summary.trim(),
    highlights: parsed.highlights.map((highlight) => highlight.trim()),
    source: {
      packageName: context.packageName,
      packageDir: context.packageDir,
      previousVersion: context.previousVersion,
      sinceCommit: context.sinceCommit,
    },
  }
}

const requestChangelog = async (context: ReleaseContext, options: Options, date: string): Promise<ChangelogEntry> => {
  const mockResponse = options.mockResponse ?? process.env.SCALAR_RELEASE_CHANGELOG_MOCK_RESPONSE
  if (mockResponse) {
    return parseModelResponse(mockResponse, context, date)
  }

  const apiKey = process.env.SCALAR_RELEASE_CHANGELOG_API_KEY ?? process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Set SCALAR_RELEASE_CHANGELOG_API_KEY or OPENAI_API_KEY to generate an LLM changelog')
  }

  const baseUrl = (
    options.baseUrl ??
    process.env.SCALAR_RELEASE_CHANGELOG_BASE_URL ??
    'https://api.openai.com/v1'
  ).replace(/\/$/, '')
  const model = options.model ?? process.env.SCALAR_RELEASE_CHANGELOG_MODEL ?? 'gpt-4.1'
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You write crisp product changelogs and return only valid JSON.',
        },
        {
          role: 'user',
          content: buildPrompt(context, date),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM changelog request failed: ${response.status} ${await response.text()}`)
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = body.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('LLM changelog response did not include message content')
  }

  return parseModelResponse(content, context, date)
}

const formatMarkdownEntry = (entry: ChangelogEntry): string => {
  const highlights = entry.highlights.map((highlight) => `- ${highlight}`).join('\n')

  return [
    `${VERSION_HEADING_PREFIX}${entry.version}`,
    '',
    `### ${entry.title}`,
    '',
    entry.date,
    '',
    entry.summary,
    '',
    highlights,
  ].join('\n')
}

const getChangelogTitle = (entry: ChangelogEntry): string => `# ${entry.source.packageName}`

const findVersionSection = (lines: string[], version: string): { start: number; end: number } | null => {
  const start = lines.findIndex((line) => line.trim() === `${VERSION_HEADING_PREFIX}${version}`)
  if (start === -1) {
    return null
  }

  const nextSectionOffset = lines.slice(start + 1).findIndex((line) => line.startsWith(VERSION_HEADING_PREFIX))
  const end = nextSectionOffset === -1 ? lines.length : start + 1 + nextSectionOffset

  return { start, end }
}

export const writeChangelogEntry = async (repoRoot: string, output: string, entry: ChangelogEntry): Promise<string> => {
  const changelogPath = resolve(repoRoot, output)
  const releaseEntry = formatMarkdownEntry(entry)

  let existing = ''
  try {
    existing = await readFile(changelogPath, 'utf8')
  } catch {
    existing = `${getChangelogTitle(entry)}\n`
  }

  const lines = existing.trimEnd().split('\n')
  const section = findVersionSection(lines, entry.version)
  const nextEntry = releaseEntry.split('\n')

  const nextLines = section
    ? [...lines.slice(0, section.start), ...nextEntry, ...lines.slice(section.end)]
    : [lines[0]?.startsWith('# ') ? lines[0] : getChangelogTitle(entry), '', ...nextEntry, '', ...lines.slice(1)]

  await mkdir(dirname(changelogPath), { recursive: true })
  await writeFile(changelogPath, `${nextLines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`)

  return relative(repoRoot, changelogPath)
}

export const generateReleaseChangelog = new Command('generate-release-changelog')
  .description('Generate an LLM-written app changelog entry when a package is released')
  .requiredOption('--package-dir <path>', 'package directory to watch for version changes')
  .option('--output <path>', 'path to the generated CHANGELOG.md file')
  .option('--package-name <name>', 'package name override for the LLM prompt')
  .option('--title <title>', 'product title for the LLM prompt')
  .option('--allow-missing', 'exit successfully when the package directory does not exist')
  .option('--dry-run', 'collect release context without calling the LLM or writing files')
  .option('--mock-response <json>', 'use a local JSON response instead of calling the LLM')
  .option('--model <model>', 'LLM model name')
  .option('--base-url <url>', 'OpenAI-compatible chat completions base URL')
  .action(async (options: Options) => {
    const repoRoot = process.cwd()
    if (options.allowMissing) {
      try {
        await runGit(['rev-parse', '--verify', 'HEAD'], repoRoot)
      } catch {
        console.log('No git HEAD found; skipping LLM changelog generation.')
        return
      }
    }

    const context = await collectReleaseContext(repoRoot, options)

    if (!context) {
      console.log('No package release detected; skipping LLM changelog generation.')
      return
    }

    if (options.dryRun) {
      console.log(JSON.stringify(context, null, 2))
      return
    }

    const date = process.env.SCALAR_RELEASE_CHANGELOG_DATE ?? new Date().toISOString().slice(0, 10)
    const entry = await requestChangelog(context, options, date)
    const output = options.output ?? join(context.packageDir, 'CHANGELOG.md')
    const releasePath = await writeChangelogEntry(repoRoot, output, entry)

    console.log(`Generated ${releasePath}`)
  })
