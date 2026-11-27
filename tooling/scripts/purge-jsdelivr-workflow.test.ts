import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

type Step = {
  id?: string
  name?: string
  if?: string
  with?: { 'publish-script'?: string }
  env?: Record<string, string>
  run?: string
}

const workflowSteps = (file: string, job: string): Step[] => {
  const yaml = readFileSync(new URL(`../../.github/workflows/${file}.yml`, import.meta.url), 'utf8')
  return parse(yaml).jobs[job].steps
}

describe('purge-jsdelivr-workflow', () => {
  it.each([
    {
      scenario: 'deferred publication of the current version',
      publishedPackages: [{ name: '@scalar/api-reference', version: '2.0.0' }],
      purgeAll: true,
    },
    { scenario: 'no packages published', publishedPackages: [], purgeAll: false },
    {
      scenario: 'another package published',
      publishedPackages: [{ name: '@scalar/api-client', version: '2.0.0' }],
      purgeAll: false,
    },
    { scenario: 'no publish command ran', publishedPackages: undefined, purgeAll: false },
  ])('passes the release decision to the purge script for $scenario', ({ publishedPackages, purgeAll }) => {
    const release = workflowSteps('release', 'npm-publish')
    const purge = workflowSteps('purge-cdn', 'purge')
    const summary = release.find((step) => step.id === 'publish-summary')
    const marker = release.find((step) => step.if === "steps.publish-summary.outputs.api_reference == 'true'")
    const decision = purge.find((step) => step.id === 'published')
    if (!summary?.run || !marker?.name || !decision?.run) {
      throw new Error('Missing publish summary, publication marker, or purge decision')
    }
    expect(release.find((step) => step.id === 'changesets')?.with?.['publish-script']?.split(/\s+/)).toContain(
      '--report-summary',
    )
    const script = purge.find((step) => step.run?.includes('node ./tooling/scripts/purge-jsdelivr.mjs'))
    expect(script?.env?.PURGE_ALL).toBe('${{ steps.published.outputs.purge_all }}')
    expect(script?.env?.WAIT_FOR_NPM).toBe('${{ steps.published.outputs.wait_for_npm }}')

    const cwd = mkdtempSync(join(tmpdir(), 'purge-handoff-'))
    const output = join(cwd, 'github-output')
    const env = {
      PATH: `${cwd}:${process.env.PATH}`,
      GITHUB_OUTPUT: output,
      GITHUB_REPOSITORY: 'scalar/scalar',
      EVENT_NAME: 'workflow_run',
      RUN_ID: '10',
      RUN_ATTEMPT: '1',
    }
    try {
      mkdirSync(join(cwd, 'packages/api-reference'), { recursive: true })
      writeFileSync(join(cwd, 'packages/api-reference/package.json'), JSON.stringify({ version: '2.0.0' }))
      if (publishedPackages) {
        writeFileSync(join(cwd, 'pnpm-publish-summary.json'), JSON.stringify({ publishedPackages }))
      }
      writeFileSync(output, '')
      execFileSync('bash', ['-eo', 'pipefail', '-c', summary.run], { cwd, env })

      // GitHub exposes the release step's display name and conclusion to the next workflow.
      const published = readFileSync(output, 'utf8').trim() === 'api_reference=true'
      const steps = [{ name: marker.name, conclusion: published ? 'success' : 'skipped' }]
      writeFileSync(
        join(cwd, 'jobs.json'),
        JSON.stringify({ jobs: [{ name: 'release / npm-publish', conclusion: 'success', steps }] }),
      )
      // Serve the job fixture through the workflow's own --jq filter.
      writeFileSync(
        join(cwd, 'gh'),
        `#!/bin/sh
set -eu
test "$1" = api
test "$2" = repos/scalar/scalar/actions/runs/10/attempts/1/jobs
test "$4" = --jq
exec jq -c "$5" jobs.json
`,
        { mode: 0o755 },
      )

      writeFileSync(output, '')
      execFileSync('bash', ['-eo', 'pipefail', '-c', decision.run], { cwd, env })
      expect(readFileSync(output, 'utf8').trim().split('\n')).toStrictEqual([
        'wait_for_npm=true',
        `purge_all=${purgeAll}`,
      ])
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
