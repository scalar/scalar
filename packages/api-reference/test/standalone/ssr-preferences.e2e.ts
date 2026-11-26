import { expect, test } from '@playwright/test'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import { getJsAsset, renderApiReferenceToString } from '../../../server-side-rendering/src/ssr'

for (const layout of ['modern', 'classic'] as const) {
  test(`hydrates ${layout} controls before applying a saved dark preference and deep link`, async ({ page }) => {
    // Opening every tag avoids coupling this preference regression to the first-tag fix in #11041.
    const configuration = {
      layout,
      defaultOpenAllTags: true,
      withDefaultFonts: false,
      content: {
        openapi: '3.1.0',
        info: { title: 'Saved theme API', version: '1.0.0' },
        paths: { '/things': { get: { summary: 'List things', responses: { '200': { description: 'OK' } } } } },
      },
    } satisfies Partial<ApiReferenceConfiguration>
    const html = await renderApiReferenceToString(configuration)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (/hydration/i.test(message.text())) {
        errors.push(message.text())
      }
    })
    await page.route('https://ssr.example.test/', (route) =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html><body><div id="app">${html}</div></body></html>`,
      }),
    )
    await page.goto('https://ssr.example.test/')
    const target = await page.locator('a[href$="GET/things"]').first().getAttribute('href')
    expect(target).not.toBeNull()
    await page.evaluate((hash) => {
      localStorage.setItem('colorMode', 'dark')
      window.location.hash = hash ?? ''
    }, target)
    const heading = await page.getByRole('heading', { name: 'Saved theme API', level: 1 }).elementHandle()
    await page.addScriptTag({ content: getJsAsset() })
    await page.evaluate((config) => {
      window.Scalar.createApiReference('#app', config)
    }, configuration)
    await expect(page.locator('script[data-scalar-hydration]')).toHaveCount(0)
    await expect(page.locator('body')).toHaveClass(/dark-mode/)
    await expect(
      page.getByRole('heading', { name: layout === 'classic' ? '/things List things' : 'List things', exact: true }),
    ).toBeInViewport()
    await expect(page.locator('[aria-label="Set light mode"]:visible').first()).toBeVisible()
    expect(await heading?.evaluate((element) => element.isConnected)).toBe(true)
    expect(errors).toStrictEqual([])
  })
}
