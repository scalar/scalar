import { type Server, createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

import { type Page, expect } from '@playwright/test'

import { waitForScalarAppShellReady } from './wait-for-scalar-app-shell-ready'

const SCRIPT_TEST_DOCUMENT = 'e2e-request-scripts-csp'
const DOCUMENT_DRAFTS_OVERVIEW = '/@local/default/document/drafts/overview'
const MOCK_SERVER_HOST = '127.0.0.1'

type ScriptMockServer = {
  server: Server
  origin: string
}

const startScriptMockServer = async (): Promise<ScriptMockServer> => {
  const server = createServer((request, response) => {
    response.setHeader('access-control-allow-origin', '*')

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'access-control-allow-methods': 'GET, HEAD, OPTIONS',
        'access-control-allow-headers': '*',
      })
      response.end()
      return
    }

    if (request.method === 'GET' && request.url?.startsWith('/scripts')) {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ ok: true }))
      return
    }

    response.writeHead(404, { 'content-type': 'text/plain' })
    response.end('not found')
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, MOCK_SERVER_HOST, () => {
      server.off('error', reject)
      resolve()
    })
  })

  const address = server.address() as AddressInfo | null

  if (!address) {
    throw new Error('Mock server did not bind to a port')
  }

  return {
    server,
    origin: `http://${MOCK_SERVER_HOST}:${address.port}`,
  }
}

const stopScriptMockServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

const seedScriptDocument = async (page: Page, serverUrl: string): Promise<void> => {
  await page.evaluate(
    async ({ documentName, serverUrl }: { documentName: string; serverUrl: string }) => {
      const store = window.dumpAppState().store.value

      if (!store) {
        throw new Error('Workspace store is not ready')
      }

      const ok = await store.addDocument({
        name: documentName,
        document: {
          openapi: '3.1.0',
          info: {
            title: 'E2E request scripts CSP',
            version: '1.0.0',
          },
          'x-scalar-selected-server': serverUrl,
          servers: [{ url: serverUrl }],
          paths: {
            '/': {
              get: {
                summary: 'Run scripts under CSP',
                'x-pre-request': 'pm.globals.set("preRequestRan", "yes")',
                'x-post-response': `
                  pm.test("pre-request script ran", () => {
                    pm.expect(pm.globals.get("preRequestRan")).to.eq("yes")
                  })
                  pm.test("post-response script ran", () => {
                    pm.response.to.have.status(200)
                    pm.expect(pm.response.json()).to.deep.equal({ ok: true })
                  })
                `,
                responses: {
                  '200': {
                    description: 'Script execution response',
                  },
                },
              },
            },
          },
        },
      })

      if (!ok) {
        throw new Error('store.addDocument returned false')
      }
    },
    { documentName: SCRIPT_TEST_DOCUMENT, serverUrl },
  )
}

const navigateToDraftsOverview = async (page: Page): Promise<void> => {
  if (page.url().startsWith('file:')) {
    await page.evaluate((path) => {
      window.location.hash = path
    }, DOCUMENT_DRAFTS_OVERVIEW)
    await page.waitForURL(/#\/@local\/default\/document\/drafts\/overview/, { timeout: 60_000 })
    return
  }

  await page.goto(DOCUMENT_DRAFTS_OVERVIEW, { waitUntil: 'load', timeout: 60_000 })
  await expect(page).toHaveURL(/\/document\/drafts\//)
}

export const runSandboxPostMessageSmokeScenario = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    const isFileUrl = window.location.protocol === 'file:'
    const expectedOrigin = isFileUrl ? 'null' : window.location.origin
    const iframe = document.createElement('iframe')
    iframe.src = new URL('sandbox.html', document.baseURI).href
    document.body.appendChild(iframe)

    const channel = 'scalar-pre-post-request-scripts-sandbox'

    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        window.removeEventListener('message', onMessage)
        reject(new Error('Sandbox iframe did not report readiness'))
      }, 30_000)

      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) {
          return
        }

        if (event.origin !== expectedOrigin) {
          reject(new Error(`Expected sandbox message origin to be ${expectedOrigin}, received ${event.origin}`))
          return
        }

        const data = event.data as { channel?: string; kind?: string } | null
        if (data?.channel === channel && data.kind === 'ready') {
          window.clearTimeout(timeoutId)
          window.removeEventListener('message', onMessage)
          resolve()
        }
      }

      window.addEventListener('message', onMessage)
    })

    const testResults = await new Promise<{ title: string; passed: boolean }[]>((resolve, reject) => {
      const id = crypto.randomUUID()
      const results: { title: string; passed: boolean }[] = []
      const timeoutId = window.setTimeout(() => {
        window.removeEventListener('message', onMessage)
        reject(new Error('Sandbox iframe did not complete script execution'))
      }, 30_000)

      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) {
          return
        }

        if (event.origin !== expectedOrigin) {
          reject(new Error(`Expected sandbox message origin to be ${expectedOrigin}, received ${event.origin}`))
          return
        }

        const data = event.data as {
          channel?: string
          kind?: string
          id?: string
          results?: { title: string; passed: boolean }[]
          error?: string
        } | null
        if (data?.channel !== channel || data.id !== id) {
          return
        }

        if (data.kind === 'test-results' && data.results) {
          results.splice(0, results.length, ...data.results)
        }

        if (data.kind === 'done') {
          window.clearTimeout(timeoutId)
          window.removeEventListener('message', onMessage)

          if (data.error) {
            reject(new Error(data.error))
            return
          }

          resolve(results)
        }
      }

      window.addEventListener('message', onMessage)
      iframe.contentWindow?.postMessage(
        {
          channel,
          kind: 'execute',
          id,
          listen: 'test',
          script: 'pm.test("file origin sandbox executed", () => pm.expect(true).to.eq(true))',
        },
        '*',
      )
    })

    iframe.remove()

    if (!testResults.some((result) => result.title === 'file origin sandbox executed' && result.passed)) {
      throw new Error('Sandbox script did not report the expected passing test result')
    }
  })
}

export const runRequestScriptsCspScenario = async (page: Page): Promise<void> => {
  const mockServer = await startScriptMockServer()

  try {
    const cspErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && /content security policy|unsafe-eval|script-src/i.test(message.text())) {
        cspErrors.push(message.text())
      }
    })

    await navigateToDraftsOverview(page)
    await waitForScalarAppShellReady(page)

    await seedScriptDocument(page, mockServer.origin)

    await page.evaluate((documentName) => {
      const path = `/@local/default/document/${documentName}/path/%252F/method/get/example/default`
      if (window.location.href.startsWith('file:')) {
        window.location.hash = path
        return
      }

      window.location.assign(path)
    }, SCRIPT_TEST_DOCUMENT)
    await expect(page).toHaveURL(new RegExp(`/document/${SCRIPT_TEST_DOCUMENT}/.*example/default`))

    const sendButton = page.locator('[data-addressbar-action="send"]:visible').first()
    await sendButton.click()
    await expect(sendButton).not.toBeDisabled({ timeout: 60_000 })

    const main = page.locator('main')
    await expect(main.getByText('pre-request script ran', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(main.getByText('post-response script ran', { exact: true })).toBeVisible()
    await expect(main.getByText('2/2', { exact: true })).toBeVisible()
    expect(cspErrors, cspErrors.join('\n')).toEqual([])
  } finally {
    await stopScriptMockServer(mockServer.server)
  }
}
