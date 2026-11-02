import { join } from 'node:path'

import { expect, test } from '@playwright/test'

const bundle = join(import.meta.dirname, '../../dist/webComponent/component.js')

test('sidebar navigation reaches an operation inside the shadow root', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://component.example.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<scalar-api-reference></scalar-api-reference>',
    }),
  )
  await page.goto('https://component.example.test/')
  await page.evaluate(() => {
    Object.assign(document.querySelector('scalar-api-reference')!, {
      configuration: {
        content: {
          openapi: '3.1.0',
          info: { title: 'Navigation API', version: '1.0.0', description: 'Introduction.\n\n'.repeat(100) },
          paths: { '/ping': { get: { summary: 'Ping operation', responses: { '200': { description: 'OK' } } } } },
        },
        showDeveloperTools: 'never',
      },
    })
  })
  await page.addScriptTag({ path: bundle })
  const element = page.locator('scalar-api-reference')
  await element.getByRole('link', { name: 'Ping operation', exact: false }).click()
  await expect(element.getByRole('heading', { name: 'Ping operation', exact: true })).toBeInViewport()
  expect(errors).toEqual([])
})
