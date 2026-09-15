import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from '../src/create-markdown-from-openapi'
import { extendedFixtures } from './extended-fixtures'
import { baselineFixtures } from './fixtures'
import { corpusVersion, evaluateFixture } from './harness'

describe('evaluate', () => {
  it('measures feature coverage and Markdown quality without losing baseline behavior', async () => {
    const results: Awaited<ReturnType<typeof evaluateFixture>>[] = []
    for (const fixture of [...baselineFixtures, ...extendedFixtures]) {
      results.push(await evaluateFixture(fixture, createMarkdownFromOpenApi))
    }

    const checks = results.flatMap((result) => result.checks)
    const report = {
      corpusVersion,
      groups: Object.fromEntries(
        [...new Set(results.map((result) => result.group))].map((group) => {
          const checks = results.filter((result) => result.group === group).flatMap((result) => result.checks)
          return [group, { passed: checks.filter((check) => check.passed).length, total: checks.length }]
        }),
      ),
      passed: checks.filter((check) => check.passed).length,
      total: checks.length,
      fixtures: results.map(({ markdown: _markdown, ...result }) => result),
    }
    if (process.env.MARKDOWN_EVALUATION_PREVIOUS) {
      const previous = JSON.parse(
        await readFile(resolve(process.env.MARKDOWN_EVALUATION_PREVIOUS), 'utf8'),
      ) as typeof report
      if (previous.corpusVersion !== corpusVersion) throw new Error('Cannot compare different corpus versions')
      const previousChecks = new Map(
        previous.fixtures.flatMap((fixture) =>
          fixture.checks.map((check) => [`${fixture.fixture}: ${check.name}`, check.passed] as const),
        ),
      )
      const currentChecks = new Map(
        report.fixtures.flatMap((fixture) =>
          fixture.checks.map((check) => [`${fixture.fixture}: ${check.name}`, check.passed] as const),
        ),
      )
      if (
        previousChecks.size !== currentChecks.size ||
        [...currentChecks.keys()].some((key) => !previousChecks.has(key))
      ) {
        throw new Error('Check identities changed without a corpus version bump')
      }
      const comparison = {
        newlyPassing: [...currentChecks]
          .filter(([key, passed]) => passed && previousChecks.get(key) === false)
          .map(([key]) => key),
        regressed: [...currentChecks]
          .filter(([key, passed]) => !passed && previousChecks.get(key) === true)
          .map(([key]) => key),
      }
      Object.assign(report, { comparison })
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
  }, 60_000)
})
