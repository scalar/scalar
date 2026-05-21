import { test } from '@playwright/test'

import { runRequestScriptsCspScenario } from './helpers/request-scripts-csp-scenario'

test.describe('request-scripts-csp.e2e', () => {
  test.setTimeout(120_000)

  test('pre-request and post-response scripts run under the app content security policy', async ({ page }) => {
    await runRequestScriptsCspScenario(page)
  })
})
