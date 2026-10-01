import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { expect, test } from '@playwright/test'
import { Hono } from 'hono'

/** Serve the Storybook build produced by the cloud API reference job. */
const serveStories = (): Promise<{ url: string; close: () => void }> => {
  const app = new Hono()
  app.get('*', serveStatic({ root: './storybook-static' }))
  return new Promise((resolve) => {
    const server = serve({ fetch: app.fetch, port: 0 }, ({ port }) => {
      resolve({
        url: `http://localhost:${port}`,
        close: () => {
          server.close()
        },
      })
    })
  })
}

test('navigation capabilities expose destinations or explicit disabled controls', async ({ page }, testInfo) => {
  const stories = await serveStories()
  try {
    await page.goto(`${stories.url}/iframe.html?id=navigation-capabilities--supported&viewMode=story`)
    const surface = page.getByTestId('navigation-capabilities')
    const bodyModel = page.getByTestId('request-body-schema-name').getByRole('button')
    const propertyModel = page.getByTestId('property-heading').getByRole('button')
    const client = page.getByRole('button', { name: /Test Request/ })
    await expect(bodyModel).toBeEnabled()
    await expect(propertyModel).toBeEnabled()
    await expect(client).toBeEnabled()
    await testInfo.attach('navigation-supported', { body: await surface.screenshot(), contentType: 'image/png' })
    await bodyModel.click()
    await expect(page.getByRole('status')).toHaveText('Model: Pet')
    await client.click()
    await expect(page.getByRole('status')).toHaveText('Client: create-pet')
    await propertyModel.click()
    await expect(page.getByRole('status')).toHaveText('Model: Pet')

    await page.goto(`${stories.url}/iframe.html?id=navigation-capabilities--disabled&viewMode=story`)
    await expect(page.getByTestId('request-body-schema-name')).toContainText('Pet')
    await expect(page.getByTestId('request-body-schema-name').getByRole('button')).toHaveCount(0)
    await expect(page.getByTestId('property-heading').getByRole('button')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Test Request/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: /Test Request/ })).toHaveCSS('opacity', '0.5')
    await testInfo.attach('navigation-disabled', { body: await surface.screenshot(), contentType: 'image/png' })
  } finally {
    stories.close()
  }
})
