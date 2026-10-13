import { join } from 'node:path'

import { expect, test } from '@playwright/test'

test('destroying one reference preserves matching operations in another', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://navigation.example.test/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<div id="first"></div><div id="second"></div>' }),
  )
  await page.goto('https://navigation.example.test/')
  await page.addScriptTag({ path: join(import.meta.dirname, '../../dist/browser/standalone.js') })
  await page.addScriptTag({
    content: `
      const references = ['first', 'second'].map((id) => Scalar.createApiReference('#' + id, {
        content: {
          openapi: '3.1.0',
          info: { title: id + ' API', version: '1.0.0' },
          paths: { '/ping': { get: { summary: 'Ping operation', responses: { '200': { description: 'OK' } } } } },
        },
        showDeveloperTools: 'never',
      }))
      window.destroySecondReference = () => references[1].destroy()
    `,
  })
  const first = page.locator('#first')
  const second = page.locator('#second')
  await expect(first.getByRole('heading', { name: 'Ping operation', exact: true })).toHaveCount(1)
  await second.getByRole('heading', { name: 'second API', exact: true }).scrollIntoViewIfNeeded()
  await expect(second.getByRole('heading', { name: 'Ping operation', exact: true })).toHaveCount(1)
  await page.evaluate('window.destroySecondReference()')
  await expect(second.getByRole('heading', { name: 'Ping operation', exact: true })).toHaveCount(0)
  await first.getByRole('heading', { name: 'Ping operation', exact: true }).scrollIntoViewIfNeeded()
  await expect(first.getByRole('heading', { name: 'Ping operation', exact: true })).toBeVisible()
  expect(errors).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('surviving-reference.png') })
})
