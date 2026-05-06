import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), 'delete-cloudflare-pages-preview.sh')

type RunOptions = {
  perPage?: string
  branch?: string
}

const runWithFakeCurl = (fakeCurlSource: string, options: RunOptions = {}) => {
  const directory = mkdtempSync(join(tmpdir(), 'cf-preview-test-'))
  const fakeCurlPath = join(directory, 'fake-curl.js')
  const recordFilePath = join(directory, 'deleted.txt')

  writeFileSync(fakeCurlPath, `#!/usr/bin/env node\n${fakeCurlSource}`)
  chmodSync(fakeCurlPath, 0o755)

  const result = spawnSync('bash', [scriptPath], {
    cwd: join(dirname(fileURLToPath(import.meta.url)), '../..'),
    env: {
      ...process.env,
      BRANCH: options.branch ?? 'pr-123',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_PER_PAGE: options.perPage ?? '2',
      CURL_COMMAND: fakeCurlPath,
      PROJECT_NAME: 'project',
      RECORD_FILE: recordFilePath,
    },
    encoding: 'utf8',
  })

  return { result, recordFilePath }
}

describe('delete-cloudflare-pages-preview', () => {
  it('deletes every matching deployment across paginated results', () => {
    // Page 1 is full (== per_page), so the script must keep paginating; page 2
    // is partial, which is how we know we have reached the end. result_info is
    // intentionally omitted because Cloudflare does not always include
    // total_pages — the script must not depend on it.
    const fakeCurlSource = String.raw`
const { appendFileSync, writeFileSync } = require('node:fs')
const args = process.argv.slice(2)
const output = args[args.indexOf('--output') + 1]
const url = args.find((arg) => arg.startsWith('https://'))
const method = args.includes('--request') ? args[args.indexOf('--request') + 1] : 'GET'

if (method === 'DELETE') {
  const id = url.match(/deployments\/([^?]+)/)[1]
  appendFileSync(process.env.RECORD_FILE, id + '\n')
  writeFileSync(output, JSON.stringify({ success: true, result: {} }))
  process.stdout.write('200')
  process.exit(0)
}

const page = Number(new URL(url).searchParams.get('page'))
const result = page === 1
  ? [
      { id: 'skip-other-branch', deployment_trigger: { metadata: { branch: 'pr-999' } } },
      { id: 'delete-page-1', deployment_trigger: { metadata: { branch: 'pr-123' } } },
    ]
  : [{ id: 'delete-page-2', deployment_trigger: { metadata: { branch: 'pr-123' } } }]

writeFileSync(output, JSON.stringify({ success: true, result }))
process.stdout.write('200')
`

    const { result, recordFilePath } = runWithFakeCurl(fakeCurlSource)

    expect(result.status).toBe(0)
    expect(result.stdout.trim().split('\n')).toStrictEqual([
      'Looking for preview deployments on branch: pr-123',
      'Scanned Cloudflare deployment page 1',
      'Scanned Cloudflare deployment page 2',
      'Deleted deployment delete-page-1',
      'Deleted deployment delete-page-2',
    ])
    expect(readFileSync(recordFilePath, 'utf8').trim().split('\n')).toStrictEqual(['delete-page-1', 'delete-page-2'])
  })

  it('stops paginating when the first page is partial', () => {
    const fakeCurlSource = String.raw`
const { appendFileSync, writeFileSync } = require('node:fs')
const args = process.argv.slice(2)
const output = args[args.indexOf('--output') + 1]
const url = args.find((arg) => arg.startsWith('https://'))
const method = args.includes('--request') ? args[args.indexOf('--request') + 1] : 'GET'

if (method === 'DELETE') {
  const id = url.match(/deployments\/([^?]+)/)[1]
  appendFileSync(process.env.RECORD_FILE, id + '\n')
  writeFileSync(output, JSON.stringify({ success: true, result: {} }))
  process.stdout.write('200')
  process.exit(0)
}

const page = Number(new URL(url).searchParams.get('page'))
if (page > 1) {
  // Should never be requested — the script should stop after the first partial page.
  writeFileSync(output, JSON.stringify({ success: false, errors: [{ message: 'unexpected page request' }] }))
  process.stdout.write('500')
  process.exit(0)
}

writeFileSync(output, JSON.stringify({
  success: true,
  result: [{ id: 'only-deployment', deployment_trigger: { metadata: { branch: 'pr-123' } } }],
}))
process.stdout.write('200')
`

    const { result, recordFilePath } = runWithFakeCurl(fakeCurlSource)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Scanned Cloudflare deployment page 1')
    expect(result.stdout).not.toContain('Scanned Cloudflare deployment page 2')
    expect(readFileSync(recordFilePath, 'utf8').trim().split('\n')).toStrictEqual(['only-deployment'])
  })

  it('exits 0 with no deletions when the branch has no deployments', () => {
    const fakeCurlSource = String.raw`
const { writeFileSync } = require('node:fs')
const args = process.argv.slice(2)
const output = args[args.indexOf('--output') + 1]

writeFileSync(output, JSON.stringify({
  success: true,
  result: [{ id: 'someone-else', deployment_trigger: { metadata: { branch: 'pr-999' } } }],
}))
process.stdout.write('200')
`

    const { result, recordFilePath } = runWithFakeCurl(fakeCurlSource)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('No preview deployments found for pr-123; nothing to delete')
    expect(() => readFileSync(recordFilePath, 'utf8')).toThrow()
  })

  it('continues deleting after an individual deletion fails and exits non-zero', () => {
    // Cloudflare can refuse to delete the active alias deployment for a
    // branch even with force=true. The script must still attempt the rest of
    // the deployments instead of bailing on the first failure.
    const fakeCurlSource = String.raw`
const { appendFileSync, writeFileSync } = require('node:fs')
const args = process.argv.slice(2)
const output = args[args.indexOf('--output') + 1]
const url = args.find((arg) => arg.startsWith('https://'))
const method = args.includes('--request') ? args[args.indexOf('--request') + 1] : 'GET'

if (method === 'DELETE') {
  const id = url.match(/deployments\/([^?]+)/)[1]
  appendFileSync(process.env.RECORD_FILE, id + '\n')
  if (id === 'fails-to-delete') {
    writeFileSync(output, JSON.stringify({ success: false, errors: [{ message: 'active alias' }] }))
    process.stdout.write('400')
    process.exit(0)
  }
  writeFileSync(output, JSON.stringify({ success: true, result: {} }))
  process.stdout.write('200')
  process.exit(0)
}

const page = Number(new URL(url).searchParams.get('page'))
const result = page === 1
  ? [
      { id: 'delete-first', deployment_trigger: { metadata: { branch: 'pr-123' } } },
      { id: 'fails-to-delete', deployment_trigger: { metadata: { branch: 'pr-123' } } },
    ]
  : []

writeFileSync(output, JSON.stringify({ success: true, result }))
process.stdout.write('200')
`

    const { result, recordFilePath } = runWithFakeCurl(fakeCurlSource)

    expect(result.status).toBe(1)
    // Every deployment must be attempted, even though one of them fails.
    expect(readFileSync(recordFilePath, 'utf8').trim().split('\n').sort()).toStrictEqual([
      'delete-first',
      'fails-to-delete',
    ])
    expect(result.stdout).toContain('Deleted deployment delete-first')
    expect(result.stdout).toContain('Failed to delete Cloudflare Pages deployment fails-to-delete (HTTP 400)')
    expect(result.stdout).toContain('active alias')
    expect(result.stdout).toContain('Failed to delete 1 of 2 deployment(s) for pr-123')
  })

  it('reports Cloudflare API errors when listing fails', () => {
    const fakeCurlSource = String.raw`
const { writeFileSync } = require('node:fs')
const args = process.argv.slice(2)
const output = args[args.indexOf('--output') + 1]

writeFileSync(output, JSON.stringify({ success: false, result: null, errors: [{ message: 'project not found' }] }))
process.stdout.write('200')
`

    const { result } = runWithFakeCurl(fakeCurlSource)

    expect(result.status).toBe(1)
    expect(result.stdout.trim().split('\n')).toStrictEqual([
      'Looking for preview deployments on branch: pr-123',
      'Failed to list Cloudflare Pages deployments',
      'project not found',
    ])
  })
})
