import { test } from '@playwright/test'

import { apiReference } from './api-reference-ui-test'

const HOST = process.env.HOST || 'localhost'

test('Renders scalar/galaxy api reference', async ({ page, isMobile }) => {
  await page.goto(`http://${HOST}:3173/local`)
  await apiReference(page, isMobile)
})
