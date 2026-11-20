import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createRequire } from 'node:module'
import { setTimeout as delay } from 'node:timers/promises'

// Playwright is installed globally in the image. CommonJS resolution reads NODE_PATH.
const require = createRequire(import.meta.url)
const { chromium }: typeof import('@playwright/test') = require('@playwright/test')

const testBrowser = async (): Promise<void> => {
  const expected = process.argv[2]
  assert.ok(expected === 'enabled' || expected === 'disabled', 'Expected enabled or disabled WebGL')

  const port = 7001
  const server = spawn('playwright', ['run-server', '--host', '127.0.0.1', '--port', String(port)], {
    stdio: ['pipe', 'inherit', 'inherit'],
  })

  try {
    const deadline = Date.now() + 10_000
    while (!(await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1000) }).catch(() => null))?.ok) {
      assert.ok(server.exitCode === null && Date.now() < deadline, 'Playwright server did not start')
      await delay(100)
    }

    const browser = await chromium.connect(`ws://127.0.0.1:${port}/`, { timeout: 10_000 })
    try {
      const page = await browser.newPage()
      for (const context of ['2d', 'webgl', 'webgl2'] as const) {
        const available = await page.evaluate(
          (type) => document.createElement('canvas').getContext(type) !== null,
          context,
        )
        assert.equal(available, context === '2d' || expected === 'enabled', `Unexpected ${context} availability`)
      }
    } finally {
      await browser.close()
    }
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit', { signal: AbortSignal.timeout(5000) })
      // The browser is already closed. End the test server even if it ignores SIGTERM.
      server.kill('SIGKILL')
      await exited
    }
  }

  console.log(`Browser smoke test passed with WebGL ${expected}`)
}

testBrowser().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
