import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const origin = 'https://exports.example.com'

test.describe('response downloads', () => {
  for (const { viewer, contentType, filename, body } of [
    {
      viewer: 'regular',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'sales;November.xlsx',
      body: 'sample file body',
    },
    {
      viewer: 'virtualized',
      contentType: 'text/plain',
      filename: 'sales;November.txt',
      body: 'Export row\n'.repeat(20_000),
    },
  ]) {
    test(`preserves the quoted filename for a ${viewer} response`, async ({ page }) => {
      await page.route(`${origin}/download`, (route) =>
        route.fulfill({
          contentType,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-expose-headers': 'content-disposition',
            'content-disposition': `attachment; filename="${filename}"`,
          },
          body,
        }),
      )
      const example = await serveExample({
        proxyUrl: '',
        content: {
          openapi: '3.1.0',
          info: { title: 'Sales exports', version: '1.0.0' },
          servers: [{ url: origin }],
          paths: { '/download': { get: { responses: { '200': { description: 'Sales export' } } } } },
        },
      })

      await page.goto(example)
      await page.getByRole('button', { name: 'Test Request (get /download)', exact: true }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: /^Send Request/ }).click()
      if (viewer === 'virtualized') {
        await expect(dialog.getByText(/This response body is massive/)).toBeVisible()
      }

      const downloadLink = dialog.getByRole('link', { name: 'Download Response Body' })
      await expect(downloadLink).toHaveAttribute('download', filename)
      const [download] = await Promise.all([page.waitForEvent('download'), downloadLink.click()])
      expect(download.suggestedFilename()).toBe(filename)
    })
  }
})
