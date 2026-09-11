import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from '../src/create-markdown-from-openapi'
import { fixtures } from './fixtures'

describe('evaluate', () => {
  it('measures feature coverage and Markdown quality without losing baseline behavior', async () => {
    const results = []
    for (const fixture of fixtures) {
      const document = { openapi: '3.1.1', info: { title: 'Evaluation API', version: '1' }, ...fixture.document }
      const markdown = await createMarkdownFromOpenApi(document)
      const checks: { name: string; passed: boolean; required: boolean }[] = fixture.checks.map((check) => ({
        name: check.name,
        passed: check.pattern.test(markdown) !== ('absent' in check && check.absent),
        required: check.baseline || process.env.MARKDOWN_EVALUATION_STRICT === '1',
      }))
      checks.push({
        name: 'no leaked HTML or undefined values',
        passed: !/<\/?(?:section|div|span|h[1-6])\b|\bundefined\b|\[object Object\]/.test(markdown),
        required: true,
      })
      checks.push({
        name: 'deterministic output',
        passed: markdown === (await createMarkdownFromOpenApi(document)),
        required: true,
      })
      results.push({ fixture: fixture.name, checks, markdown })
    }

    const checks = results.flatMap((result) => result.checks)
    const report = {
      passed: checks.filter((check) => check.passed).length,
      total: checks.length,
      fixtures: results.map(({ markdown: _markdown, ...result }) => result),
    }
    console.info(JSON.stringify(report, null, 2))

    // An explicit output directory keeps ordinary tests free of generated files.
    if (process.env.MARKDOWN_EVALUATION_OUTPUT) {
      const directory = resolve(process.env.MARKDOWN_EVALUATION_OUTPUT)
      await mkdir(directory, { recursive: true })
      await writeFile(resolve(directory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
      for (const result of results) {
        await writeFile(resolve(directory, `${result.fixture}.md`), result.markdown)
      }
    }

    expect(
      results.flatMap((result) =>
        result.checks
          .filter((check) => check.required && !check.passed)
          .map((check) => `${result.fixture}: ${check.name}`),
      ),
    ).toStrictEqual([])
  })
})
