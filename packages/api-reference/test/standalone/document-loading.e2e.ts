import { join } from 'node:path'

import { expect, test } from '@playwright/test'
import { serveHTMLExample } from '@test/utils/serve-example'

test.describe
  .serial('loads content via different sources', () => {
    test('renders title for a simple document (js object)', async ({ page }) => {
      const { url, shutdown } = await serveHTMLExample(join(import.meta.dirname, 'html', 'registry-url.html'))

      await page.goto(url)

      // Wait for the remote document to finish loading before navigating away,
      // otherwise the deep link below races the in-flight fetch.
      await expect(page.getByRole('heading', { name: 'Scalar Galaxy' })).toBeVisible()

      await page.goto(`${url}#tag/planets`)
      await expect(page.getByRole('heading', { name: 'Planets', level: 2 })).toBeVisible()

      shutdown()
    })

    test('renders title for a simple document (yaml script)', async ({ page }) => {
      const { url, shutdown } = await serveHTMLExample(join(import.meta.dirname, 'html', 'yaml-script.html'))

      await page.goto(url)

      await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()

      shutdown()
    })

    test('renders title for a simple document (json script)', async ({ page }) => {
      const { url, shutdown } = await serveHTMLExample(join(import.meta.dirname, 'html', 'json-script.html'))

      await page.goto(url)

      await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()

      shutdown()
    })

    test('renders multiple documents from a data-configuration sources array', async ({ page }) => {
      const { url, shutdown } = await serveHTMLExample(
        join(import.meta.dirname, 'html', 'data-configuration-sources.html'),
      )

      // The first source is the default document.
      await page.goto(url)
      await expect(page.getByRole('heading', { name: 'Public API', level: 1 })).toBeVisible()

      // Switching document via the `?api=<slug>` query parameter renders the second source. Before
      // the fix the top-level `sources` array was stripped, so neither document rendered at all.
      await page.goto(`${url}?api=admin`)
      await expect(page.getByRole('heading', { name: 'Admin API', level: 1 })).toBeVisible()

      shutdown()
    })
  })
