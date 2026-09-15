import { isDeepStrictEqual } from 'node:util'

import type { OpenApiRenderOptions } from '../src/create-markdown-from-openapi'

/** Bump whenever fixture inputs, assertions, or scoring semantics change. */
export const corpusVersion = '2.1.1'

/** Each heading selects exactly one section inside its parent, excluding peer sections. */
export type Check = {
  name: string
  baseline: boolean
  section?: string[]
  excludeExamples?: boolean
} & ({ pattern: RegExp; absent?: boolean; count?: number } | { json: unknown; example?: number })

/** Documents are passed unchanged, including their original version field. */
export type Fixture = {
  name: string
  group: string
  document: Record<string, unknown> | string
  options?: OpenApiRenderOptions
  expectedError?: RegExp
  checks: Check[]
}

/** Select Markdown headings while ignoring headings inside fenced examples. */
export const selectSection = (markdown: string, path: string[]): string | undefined => {
  let content = markdown
  for (const title of path) {
    const lines = content.split('\n')
    let fence: string | undefined
    const headings: { index: number; depth: number; title: string }[] = []
    for (const [index, line] of lines.entries()) {
      const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1]
      if (marker) {
        if (!fence) fence = marker
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined
        continue
      }
      if (fence) continue
      const heading = /^(#{1,6}) (.+)$/.exec(line)
      if (heading) headings.push({ index, depth: heading[1]!.length, title: heading[2]! })
    }
    const matches = headings.filter((heading) => heading.title === title)
    if (matches.length !== 1) return undefined
    const selected = matches[0]!
    const end = headings.find((heading) => heading.index > selected.index && heading.depth <= selected.depth)?.index
    content = lines.slice(selected.index + 1, end).join('\n')
  }
  return content
}

/** Missing/ambiguous sections fail even negative assertions; JSON compares values, not formatting. */
export const evaluateCheck = (markdown: string, check: Check): boolean => {
  const content = check.section ? selectSection(markdown, check.section) : markdown
  if (content === undefined) return false
  if ('json' in check) {
    const blocks = [...content.matchAll(/```json\s*\n([\s\S]*?)\n```/g)]
    try {
      return isDeepStrictEqual(JSON.parse(blocks[check.example ?? 0]?.[1] ?? ''), check.json)
    } catch {
      return false
    }
  }
  const pattern = new RegExp(check.pattern.source, check.pattern.flags.replace(/[gy]/g, '') + 'g')
  const prose = check.excludeExamples ? content.replace(/```[^\n]*\n[\s\S]*?\n```/g, '') : content
  const count = [...prose.matchAll(pattern)].length
  return check.count !== undefined ? count === check.count : check.absent ? count === 0 : count > 0
}

/** Render errors remain fixture results, so later fixtures still run. */
export const evaluateFixture = async (
  fixture: Fixture,
  render: (document: Fixture['document'], options?: OpenApiRenderOptions) => Promise<string>,
): Promise<{
  fixture: string
  group: string
  markdown: string
  error?: string
  durationMs: number
  heapDeltaBytes: number
  outputBytes: number
  checks: { name: string; passed: boolean; required: boolean }[]
}> => {
  const start = performance.now()
  const heap = process.memoryUsage().heapUsed
  let markdown = ''
  let error: string | undefined
  let deterministic = false
  try {
    markdown = await render(fixture.document, fixture.options)
    // An expected failure is decided by the first render; a later failure cannot excuse initial success.
    if (!fixture.expectedError) {
      deterministic = markdown === (await render(fixture.document, fixture.options))
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause)
  }
  const checks = fixture.checks.map((check) => ({
    name: check.name,
    passed: error === undefined && evaluateCheck(markdown, check),
    required: check.baseline || process.env.MARKDOWN_EVALUATION_STRICT === '1',
  }))
  checks.push({
    name: 'render outcome',
    passed: fixture.expectedError
      ? error !== undefined && new RegExp(fixture.expectedError).test(error)
      : error === undefined,
    required: true,
  })
  if (!fixture.expectedError) {
    checks.push({
      name: 'no leaked HTML or undefined values',
      passed:
        error === undefined && !/<\/?(?:section|div|span|h[1-6])\b|\bundefined\b|\[object Object\]/.test(markdown),
      required: true,
    })
    checks.push({
      name: 'deterministic output',
      passed: error === undefined && deterministic,
      required: true,
    })
  }
  return {
    fixture: fixture.name,
    group: fixture.group,
    markdown,
    error,
    durationMs: performance.now() - start,
    heapDeltaBytes: process.memoryUsage().heapUsed - heap,
    outputBytes: Buffer.byteLength(markdown),
    checks,
  }
}
