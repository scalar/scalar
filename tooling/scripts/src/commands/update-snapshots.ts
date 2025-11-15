import fs from 'node:fs/promises'
import path from 'node:path'

import { getWorkspaceRoot } from '@/helpers'
import { Command } from 'commander'

export const updateTestSnapshots = new Command('update-snapshots')
  .description('Update the snapshot files')
  .action(async () => {
    await updateSnapshots()
  })

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
  const root = getWorkspaceRoot()
  const testResultsFolder = path.join(root, 'playwright/test-results')
  const testResultsFolders = await fs.readdir(testResultsFolder)

  // filter out retry reports
  const playwrightReports = testResultsFolders.filter((report) => !report.includes('retry'))

  for await (const report of playwrightReports) {
    // find the browser name
    const browserName = browsers.find((name) => report.includes(name))
    if (!browserName) {
      continue
    }

    const snapshotReport = await fs.readdir(path.join(testResultsFolder, report))

    // Find the "actual" snapshot file
    const actualSnapshot = snapshotReport.find((name) => name.includes('actual'))
    if (!actualSnapshot) {
      continue
    }

    // Copy the actual snapshot to the snapshot folder
    // and rename the file with the browser name and platform (linux or macos)
    await fs.copyFile(
      path.join(testResultsFolder, report, actualSnapshot),
      path.join(root, 'playwright/test/jsdelivr.spec.ts-snapshots/', `jsdelivr-snapshot-${browserName}-linux.png`),
    )
  }
}
