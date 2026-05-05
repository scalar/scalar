import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), 'delete-cloudflare-pages-preview.sh')

const runWithFakeCurl = (fakeCurlSource: string) => {
  const directory = mkdtempSync(join(tmpdir(), 'cf-preview-test-'))
  const fakeCurlPath = join(directory, 'fake-curl.js')
  const recordFilePath = join(directory, 'deleted.txt')

  writeFileSync(fakeCurlPath, `#!/usr/bin/env node\n${fakeCurlSource}`)
  chmodSync(fakeCurlPath, 0o755)

  const result = spawnSync('bash', [scriptPath], {
    cwd: join(dirname(fileURLToPath(import.meta.url)), '../..'),
    env: {
      ...process.env,
      BRANCH: 'pr-123',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_API_TOKEN: 'token',
      CURL_COMMAND: fakeCurlPath,
      PROJECT_NAME: 'project',
      RECORD_FILE: recordFilePath,
    },
    encoding: 'utf8',
  })

  return { result, recordFilePath }
}

describe('delete-cloudflare-pages-preview', () => {
  it('deletes matching deployments across paginated results', () => {
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

writeFileSync(output, JSON.stringify({ success: true, result, result_info: { total_pages: 2 } }))
process.stdout.write('200')
`

    const { result, recordFilePath } = runWithFakeCurl(fakeCurlSource)

    expect(result.status).toBe(0)
    expect(result.stdout.trim().split('\n')).toStrictEqual([
      'Looking for preview deployments on branch: pr-123',
      'Scanned Cloudflare deployment page 1 of 2',
      'Scanned Cloudflare deployment page 2 of 2',
      'Deleted deployment delete-page-1',
      'Deleted deployment delete-page-2',
    ])
    expect(readFileSync(recordFilePath, 'utf8').trim().split('\n')).toStrictEqual(['delete-page-1', 'delete-page-2'])
  })

  it('reports Cloudflare API errors', () => {
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
