import { test } from '@playwright/test'

import { testApiReference } from './testApiReference'

const HOST = process.env.HOST || 'localhost'

test('@scalar/mock-server playground (galaxy.scalar.com)', async ({ page, isMobile }) => {
  await page.goto(`http://${HOST}:5052/`)
  await testApiReference(page, isMobile)
})
