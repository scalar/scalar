import { expect, test } from '@playwright/test'
import { build } from 'vite'

import { preloadChunks } from '../../plugins/preload-chunks'

const modules: Record<string, string> = {
  'virtual:entry': `
    document.body.dataset.ready = 'true'
    document.querySelector('button').onclick = async () => {
      const { run } = await import('virtual:feature')
      document.querySelector('output').textContent = await run()
    }
  `,
  'virtual:feature': `
    document.body.dataset.featureExecuted = 'true'
    export const run = async () => (await import('virtual:nested')).message
  `,
  'virtual:nested': `
    document.body.dataset.nestedExecuted = 'true'
    export const message = 'Feature ready'
  `,
}

/** Build actual hashed chunks so the browser exercises the emitted preload URLs. */
const buildFixture = async (): Promise<Map<string, string>> => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'fixture',
        resolveId: (id) => Object.keys(modules).find((name) => id.endsWith(name)),
        load: (id) => modules[id],
      },
      preloadChunks(),
    ],
    build: {
      write: false,
      lib: { entry: 'virtual:entry', formats: ['es'], fileName: () => 'nested/entry.js' },
      rolldownOptions: { output: { chunkFileNames: 'chunks/[name]-[hash].js', minify: true } },
    },
  })

  if (!Array.isArray(result)) {
    throw new Error('Expected library build outputs')
  }

  return new Map(
    result.flatMap(({ output }) =>
      output.flatMap((file) => (file.type === 'chunk' ? [[file.fileName, file.code] as const] : [])),
    ),
  )
}

test.describe('standalone chunk preloading', () => {
  for (const origin of ['https://docs.example.test', 'https://cdn.example.test']) {
    test(`preloads nested modules without executing them and survives removal from ${origin}`, async ({ page }) => {
      const files = await buildFixture()
      const requested: string[] = []
      const finished = new Set<string>()
      const errors: string[] = []
      const deployment = { removed: false }

      page.on('pageerror', (error) => errors.push(error.message))
      page.on('requestfinished', (request) => finished.add(new URL(request.url()).pathname))
      await page.route('https://*.example.test/**', async (route) => {
        const pathname = new URL(route.request().url()).pathname
        if (pathname === '/') {
          await route.fulfill({
            contentType: 'text/html',
            body: `<button>Run feature</button><output></output><script type="module" src="${origin}/scalar/nested/entry.js"></script>`,
          })
          return
        }
        requested.push(pathname)
        const code = files.get(pathname.replace('/scalar/', ''))
        await route.fulfill({
          status: code && !deployment.removed ? 200 : 404,
          headers: { 'access-control-allow-origin': '*' },
          contentType: 'application/javascript',
          body: code && !deployment.removed ? code : 'Missing chunk',
        })
      })

      await page.goto('https://docs.example.test/')
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
      const expected = [...files.keys()].map((file) => `/scalar/${file}`).sort()
      expect(expected.length).toBe(3)
      await expect.poll(() => [...finished].filter((file) => file.startsWith('/scalar/')).sort()).toEqual(expected)
      expect([...requested].sort()).toEqual(expected)
      expect(await page.locator('body').getAttribute('data-feature-executed')).toBeNull()
      expect(await page.locator('body').getAttribute('data-nested-executed')).toBeNull()

      deployment.removed = true
      await page.getByRole('button', { name: 'Run feature' }).click()
      await expect(page.locator('output')).toHaveText('Feature ready')
      await expect(page.locator('body')).toHaveAttribute('data-feature-executed', 'true')
      await expect(page.locator('body')).toHaveAttribute('data-nested-executed', 'true')
      expect([...requested].sort()).toEqual(expected)
      expect(errors).toEqual([])
    })
  }
})
