import { expect, test } from '@nuxt/test-utils/playwright'
import { fileURLToPath } from 'node:url'

console.log(fileURLToPath(new URL('..', import.meta.url)))

test.use({
  nuxt: {
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
    browser: true,
    server: true,
  },
})

test('test', async ({ page, goto }) => {
  await goto('/', { waitUntil: 'hydration' })
  await expect(page.getByRole('heading')).toHaveText('Welcome to Playwright!')
})
