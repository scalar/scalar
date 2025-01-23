import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// List of browsers we test on
const browsers = ['chromium', 'firefox', 'Mobile-Chrome', 'Mobile-Safari']

/**
 * This script checks the playwright test results
 * for the CDN API Reference test
 * and updates the snapshot files.
 *
 * The intended use is to be run in the test-cdn-jsdelvr.yml GitHub action workflow
 */
async function updateSnapshots() {
  const testResultsFolders = await fs.readdir(
    path.join(__dirname, '../playwright/test-results'),
  )

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

    // Find the "actual" snapshot file
    const actualSnapshot = snapshotReport.find((name) =>
      name.includes('actual'),
    )
    if (!actualSnapshot) {
      continue
    }

    // Copy the actual snapshot to the snapshot folder
    // and rename the file with the browser name and platform (linux or macos)
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

updateSnapshots()
