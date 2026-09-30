import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { type Page, expect, test } from '@playwright/test'
import { serveHTMLExample } from '@test/utils/serve-example'

const packageRoot = join(import.meta.dirname, '../..')
const { version } = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as { version: string }

test.beforeAll(() => {
  const entry = join(packageRoot, 'esm.js')

  if (!existsSync(entry)) {
    throw new Error(`${entry} not found. The ESM standalone build of @scalar/api-reference generates it.`)
  }
})

/**
 * Serve the package files built in this checkout in place of a remote origin, and record the
 * paths that were requested from it. `toFile` maps a request path to a path inside the package.
 */
const interceptOrigin = async (
  page: Page,
  origin: string,
  toFile: (pathname: string) => string | undefined,
): Promise<string[]> => {
  const requested: string[] = []

  await page.route(`${origin}/**`, async (route) => {
    const { pathname } = new URL(route.request().url())
    requested.push(pathname)
    const file = toFile(pathname)

    if (!file) {
      await route.fulfill({ status: 404 })
      return
    }

    // Module scripts and their chunks are loaded cross-origin, so they need CORS headers.
    await route.fulfill({ path: join(packageRoot, file), headers: { 'access-control-allow-origin': '*' } })
  })

  return requested
}

test.describe('esm.js entry point', () => {
  test('loads the bundle and its chunks pinned to its own version from the unversioned jsDelivr URL', async ({
    page,
  }) => {
    const { url, shutdown } = await serveHTMLExample(join(import.meta.dirname, 'html', 'esm-cdn.html'))
    const requested = await interceptOrigin(
      page,
      'https://cdn.jsdelivr.net',
      (pathname) => /^\/npm\/@scalar\/api-reference(?:@[^/]*)?\/(.+)$/.exec(pathname)?.[1],
    )

    await page.goto(url)
    await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()

    const pinned = `/npm/@scalar/api-reference@${version}/`
    expect(requested[0]).toBe('/npm/@scalar/api-reference/esm.js')
    expect(requested).toContain(`${pinned}dist/browser/standalone.esm.js`)
    expect(requested.some((pathname) => pathname.includes('/dist/browser/chunks/'))).toBe(true)
    // Nothing but the entry point itself may resolve against whatever release jsDelivr serves right now.
    expect(requested.slice(1).filter((pathname) => !pathname.startsWith(pinned))).toEqual([])

    shutdown()
  })

  test('loads the bundle next to a self-hosted entry point', async ({ page }) => {
    const { url, shutdown } = await serveHTMLExample(join(import.meta.dirname, 'html', 'esm-self-hosted.html'))
    const requested = await interceptOrigin(
      page,
      'https://docs.example.test',
      (pathname) => /^\/scalar\/(.+)$/.exec(pathname)?.[1],
    )
    const cdnRequests: string[] = []
    page.on('request', (request) => {
      const { hostname } = new URL(request.url())

      if (hostname === 'jsdelivr.net' || hostname.endsWith('.jsdelivr.net')) {
        cdnRequests.push(request.url())
      }
    })

    await page.goto(url)
    await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()

    expect(requested[0]).toBe('/scalar/esm.js')
    expect(requested).toContain('/scalar/dist/browser/standalone.esm.js')
    expect(cdnRequests).toEqual([])

    shutdown()
  })
})
