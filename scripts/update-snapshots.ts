/**
 * This script updates the snapshots for the CDN API Reference test
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// ---------------------------------------------------------------------------

async function updateSnapshots() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const testResultsFolders = await fs.readdir(
    path.join(__dirname, '../playwright/test-results'),
  )

  const browsers = ['chromium', 'firefox', 'Mobile-Chrome', 'Mobile-Safari']

  // filter out retry reports
  const playwrightReports = testResultsFolders.filter(
    (report) => !report.includes('retry'),
  )

  for await (const report of playwrightReports) {
    // find the browser name
    const browserName = browsers.find((name) => report.includes(name))
    if (!browserName) {
      continue
    }

    const snapshotReport = await fs.readdir(
      path.join(__dirname, '../playwright/test-results', report),
    )

    const actualSnapshot = snapshotReport.find((name) =>
      name.includes('actual'),
    )
    if (!actualSnapshot) {
      continue
    }

    await fs.copyFile(
      path.join(
        __dirname,
        '../playwright/test-results',
        report,
        actualSnapshot,
      ),
      path.join(
        __dirname,
        '../playwright/tests/jsdelivr.spec.ts-snapshots/',
        `jsdelivr-snapshot-${browserName}-linux.png`,
      ),
    )
  }
}

// ---------------------------------------------------------------------------

updateSnapshots()
