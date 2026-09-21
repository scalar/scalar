import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

import { chromium, expect } from '@playwright/test'

const { values } = parseArgs({
  options: {
    build: { type: 'string', default: 'packages/api-reference/dist/browser' },
    config: { type: 'string', default: 'tooling/esm-size/read-only.json' },
    document: { type: 'string' },
    output: { type: 'string', default: '/tmp/scalar-esm-size.json' },
    selector: { type: 'string', default: '.operation-title' },
    'settle-ms': { type: 'string', default: '2000' },
    throttle: { type: 'boolean', default: false },
    client: { type: 'string' },
    'open-modal': { type: 'boolean', default: false },
    language: { type: 'string' },
    'expect-code': { type: 'string' },
    screenshot: { type: 'string' },
    'budget-gzip': { type: 'string' },
  },
})
const settleMs = Number(values['settle-ms'])
const budget = values['budget-gzip'] === undefined ? undefined : Number(values['budget-gzip'])
if (!Number.isFinite(settleMs) || settleMs < 0 || (budget !== undefined && (!Number.isFinite(budget) || budget < 0))) {
  throw new Error('Settle duration and budget must be non-negative numbers')
}
const directory = resolve(values.build)
const configuration: Record<string, unknown> = JSON.parse(await readFile(values.config, 'utf8'))
const documentBytes = values.document ? await readFile(values.document) : undefined
if (documentBytes) {
  if (configuration.sources || configuration.content) {
    throw new Error('--document requires a single URL configuration')
  }
  configuration.url = '/document'
}
const assets = new Map<string, { raw: Buffer; gzip: Buffer; brotliBytes: number; sha256: string }>()
for (const name of await readdir(directory, { recursive: true })) {
  if (!name.endsWith('.js') || name === 'standalone.js') {
    continue
  }
  const raw = await readFile(resolve(directory, name))
  assets.set(`/build/${name}`, {
    raw,
    gzip: gzipSync(raw, { level: 9 }),
    brotliBytes: brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    sha256: createHash('sha256').update(raw).digest('hex'),
  })
}
if (!assets.has('/build/standalone.esm.js')) {
  throw new Error('Build the production standalone ESM bundle first')
}
// Compress before navigation so compression CPU time does not contaminate cold-start timing.
const html = `<!doctype html><meta charset="utf-8"><div id="app"></div><script type="module">
import { createApiReference } from '/build/standalone.esm.js';
createApiReference('#app', ${JSON.stringify(configuration).replaceAll('<', '\\u003c')});
</script>`
const server = createServer((request, response) => {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname
  response.setHeader('Cache-Control', 'no-store')
  if (path === '/') {
    response.setHeader('Content-Type', 'text/html')
    response.end(html)
  } else if (path === '/document' && documentBytes) {
    response.setHeader('Content-Type', 'application/json')
    response.end(documentBytes)
  } else if (assets.has(path)) {
    const asset = assets.get(path)
    response.setHeader('Content-Type', 'text/javascript')
    response.setHeader('Content-Encoding', 'gzip')
    response.end(asset?.gzip)
  } else {
    response.writeHead(404).end()
  }
})
await new Promise<void>((accept) => server.listen(0, '127.0.0.1', accept))
try {
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Missing HTTP server address')
  }
  const origin = `http://127.0.0.1:${address.port}`
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    if (values.throttle) {
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 40,
        downloadThroughput: 125000,
        uploadThroughput: 125000,
      })
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    }
    const requested = new Set<string>()
    const failures: string[] = []
    const requests: { url: string; resourceType: string }[] = []
    page.on('request', (request) => {
      requests.push({ url: request.url(), resourceType: request.resourceType() })
      const url = new URL(request.url())
      if (url.origin === origin && assets.has(url.pathname)) {
        requested.add(url.pathname)
      }
    })
    page.on('pageerror', (error) => failures.push(error.message))
    page.on('requestfailed', (request) => failures.push(`${request.url()}: ${request.failure()?.errorText}`))
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failures.push(`${response.status()}: ${response.url()}`)
      }
    })
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await page.locator(values.selector).first().waitFor({ state: 'visible', timeout: 120000 })
    const operationVisibleMs = await page.evaluate(() => performance.now())
    const atOperation = new Set(requested)
    // Fixed observation window catches mount-triggered imports without an unbounded network-idle wait.
    await page.waitForTimeout(settleMs)
    const sizes = (paths: Set<string>): { files: number; rawBytes: number; gzipBytes: number; brotliBytes: number } => {
      const selected = [...paths].map((path) => assets.get(path)).filter((asset) => asset !== undefined)
      return {
        files: selected.length,
        rawBytes: selected.reduce((sum, asset) => sum + asset.raw.length, 0),
        gzipBytes: selected.reduce((sum, asset) => sum + asset.gzip.length, 0),
        brotliBytes: selected.reduce((sum, asset) => sum + asset.brotliBytes, 0),
      }
    }
    const settled = sizes(requested)
    const startupRequested = new Set(requested)
    if (values.client) {
      await page.getByTestId('client-picker').first().click()
      await page.getByRole('option', { name: values.client, exact: true }).click()
      const sample = page.locator('.request-card .scalar-code-block').first()
      if (values['expect-code']) {
        await expect(sample).toContainText(values['expect-code'], { timeout: 30000 })
      }
      if (values.language) {
        await sample.locator(`code.language-${values.language} span`).first().waitFor()
      }
      await page.waitForTimeout(settleMs)
    }
    if (values['open-modal']) {
      await page
        .getByRole('button', { name: /^Test Request/ })
        .first()
        .click()
      const dialog = page.locator('.scalar-client--open [role="dialog"][aria-label="API Client"]')
      await expect(dialog).toBeVisible({ timeout: 30000 })
      await expect(dialog.getByTestId('code-input-disabled')).toBeVisible()
      await page.waitForTimeout(settleMs)
    }
    if (values.screenshot && !values['open-modal']) {
      await page.locator('.request-card').first().scrollIntoViewIfNeeded()
    }
    if (values.screenshot) {
      await page.screenshot({ path: values.screenshot })
    }
    const report = {
      commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      buildDirectory: directory,
      workingTreeStatus: execFileSync('git', ['status', '--short'], { encoding: 'utf8' }).trim(),
      browser: browser.version(),
      node: process.version,
      configuration,
      document: documentBytes
        ? {
            file: values.document,
            bytes: documentBytes.length,
            sha256: createHash('sha256').update(documentBytes).digest('hex'),
          }
        : { url: configuration.url },
      throttle: values.throttle,
      settleMs,
      selector: values.selector,
      operationVisibleMs,
      atOperation: sizes(atOperation),
      settled,
      interaction:
        values.client || values['open-modal']
          ? { client: values.client, modal: values['open-modal'], total: sizes(requested) }
          : undefined,
      inventory: sizes(new Set(assets.keys())),
      files: [...assets]
        .map(([path, asset]) => ({
          path,
          requested: requested.has(path),
          requestedAtStartup: startupRequested.has(path),
          requestedByOperation: atOperation.has(path),
          rawBytes: asset.raw.length,
          gzipBytes: asset.gzip.length,
          brotliBytes: asset.brotliBytes,
          sha256: asset.sha256,
        }))
        .sort((a, b) => b.gzipBytes - a.gzipBytes),
      requests,
      failures,
      budgetGzip: budget,
      budgetPassed: budget === undefined ? null : settled.gzipBytes <= budget,
    }
    await writeFile(values.output, `${JSON.stringify(report, null, 2)}\n`)
    console.log(JSON.stringify({ output: values.output, operationVisibleMs, settled, failures }, null, 2))
    if (failures.length || (budget !== undefined && settled.gzipBytes > budget)) {
      process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
} finally {
  await new Promise<void>((accept, reject) => server.close((error) => (error ? reject(error) : accept())))
}
